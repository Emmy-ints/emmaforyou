-- Lead requests from the smart contract check, goal planner, AI assistant and exit offer.
CREATE TABLE IF NOT EXISTS public.tool_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool text NOT NULL,
  name text NOT NULL,
  whatsapp text,
  email text,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tool_requests_tool_ok CHECK (tool IN ('Smart contract review', 'Goal planner', 'AI assistant chat', 'Exit offer')),
  CONSTRAINT tool_requests_small CHECK (char_length(name) BETWEEN 1 AND 120 AND coalesce(char_length(whatsapp), 0) <= 40
    AND coalesce(char_length(email), 0) <= 200 AND coalesce(char_length(summary), 0) <= 3000),
  CONSTRAINT tool_requests_contact CHECK (coalesce(whatsapp, email) IS NOT NULL)
);
ALTER TABLE public.tool_requests ENABLE ROW LEVEL SECURITY;
GRANT INSERT ON public.tool_requests TO anon, authenticated;
GRANT SELECT ON public.tool_requests TO authenticated;
GRANT ALL ON public.tool_requests TO service_role;
DROP POLICY IF EXISTS "Anyone sends a tool request" ON public.tool_requests;
CREATE POLICY "Anyone sends a tool request" ON public.tool_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Admins read tool requests" ON public.tool_requests;
CREATE POLICY "Admins read tool requests" ON public.tool_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

DO $$
DECLARE d text;
BEGIN
  SELECT pg_get_functiondef('public.notify_new_lead()'::regprocedure) INTO d;
  IF position('tool_requests' IN d) = 0 THEN
    d := replace(d, $x$WHEN 'strategy_bookings' THEN 'Strategy call booked'$x$,
      $x$WHEN 'strategy_bookings' THEN 'Strategy call booked' WHEN 'tool_requests' THEN coalesce(r->>'tool', 'Tool request')$x$);
    EXECUTE d;
  END IF;
END $$;
DROP TRIGGER IF EXISTS notify_new_lead ON public.tool_requests;
CREATE TRIGGER notify_new_lead AFTER INSERT ON public.tool_requests FOR EACH ROW EXECUTE FUNCTION public.notify_new_lead();
