-- Leads from the solutions catalogue (app feature planner and per-solution enquiry forms).
ALTER TABLE public.tool_requests DROP CONSTRAINT IF EXISTS tool_requests_tool_ok;
ALTER TABLE public.tool_requests ADD CONSTRAINT tool_requests_tool_ok CHECK (tool IN ('Smart contract review', 'Goal planner', 'AI assistant chat', 'Exit offer', 'Contact form', 'App planner', 'Solution enquiry'));
