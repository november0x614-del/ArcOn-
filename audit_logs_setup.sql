
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  tx_hash TEXT,
  details JSONB
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view audit logs." ON public.audit_logs
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM public.admin_users));
