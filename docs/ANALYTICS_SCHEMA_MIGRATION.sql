-- MedCore analytics migration: LLM usage tracking indexes
-- Run after ANALYTICS_SCHEMA.sql if the table already exists.

create index if not exists analytics_events_llm_call_idx
  on analytics_events (event_type, created_at desc)
  where event_type = 'llm_call';

create index if not exists analytics_events_user_id_idx
  on analytics_events (user_id, created_at desc)
  where user_id is not null;

-- Optional: GIN index for metadata route drill-downs on LLM events
create index if not exists analytics_events_llm_route_idx
  on analytics_events using gin (metadata jsonb_path_ops)
  where event_type = 'llm_call';
