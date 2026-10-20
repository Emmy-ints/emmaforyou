-- Schedule the blog tick every 10 minutes with pg_cron (the tick itself decides whether a slot is due).
CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $$ BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'emmaforyou-blog-tick';
  PERFORM cron.schedule('emmaforyou-blog-tick', '*/10 * * * *', 'select public.blog_cron_tick()');
END $$;
