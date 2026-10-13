-- Reviews: one per approved delivery, tied to the client's own approved approval; hide user ids from the public.
CREATE UNIQUE INDEX IF NOT EXISTS client_testimonials_one_per_approval
  ON public.client_testimonials (client_user_id, approval_id) WHERE approval_id IS NOT NULL;

DROP POLICY IF EXISTS "Client writes own review" ON public.client_testimonials;
CREATE POLICY "Client writes own review" ON public.client_testimonials FOR INSERT TO authenticated
  WITH CHECK (
    client_user_id = auth.uid() AND approved = false
    AND (approval_id IS NULL OR EXISTS (
      SELECT 1 FROM public.client_approvals a
      WHERE a.id = approval_id AND a.client_user_id = auth.uid() AND a.status = 'approved'))
  );

-- Visitors only see the public fields of approved, publishable reviews.
REVOKE SELECT ON public.client_testimonials FROM anon;
GRANT SELECT (id, rating, body, display_name, business, created_at, approved, may_publish) ON public.client_testimonials TO anon;
