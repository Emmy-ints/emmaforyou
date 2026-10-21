-- Start the agent team in "review first" mode for educational posts: agents still answer members
-- automatically, but every new post waits in Dashboard → Agents → Content until the owner approves
-- it or switches "Allow automatic posts" on. Only applies if the owner hasn't changed settings yet.
UPDATE public.agent_settings SET auto_publish_posts = false WHERE id = 1 AND updated_by IS NULL;
