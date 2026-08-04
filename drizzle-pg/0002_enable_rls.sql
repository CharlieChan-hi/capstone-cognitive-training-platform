-- Keep application data private when the Supabase Data API is enabled.
-- The server uses its privileged database connection and enforces ownership
-- in the tRPC procedures, so no anonymous or client-side policies are needed.
alter table public.users enable row level security;
alter table public.training_sessions enable row level security;
alter table public.trial_data enable row level security;
alter table public.baseline_assessments enable row level security;
alter table public.assessment_tasks enable row level security;
alter table public.data_quality_flags enable row level security;
