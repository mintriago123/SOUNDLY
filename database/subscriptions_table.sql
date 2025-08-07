create table public.subscriptions (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  stripe_customer_id text null,
  stripe_subscription_id text null,
  status text not null default 'inactive'::text,
  plan_type text not null default 'free'::text,
  current_period_start timestamp with time zone null,
  current_period_end timestamp with time zone null,
  cancel_at_period_end boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint subscriptions_pkey primary key (id),
  constraint subscriptions_stripe_subscription_id_key unique (stripe_subscription_id),
  constraint unique_user_subscription unique (user_id),
  constraint subscriptions_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_subscriptions_user_id on public.subscriptions using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_subscriptions_stripe_customer_id on public.subscriptions using btree (stripe_customer_id) TABLESPACE pg_default;

create index IF not exists idx_subscriptions_stripe_subscription_id on public.subscriptions using btree (stripe_subscription_id) TABLESPACE pg_default;

create index IF not exists idx_subscriptions_status on public.subscriptions using btree (status) TABLESPACE pg_default;

create trigger sync_subscription_status
after INSERT
or
update on subscriptions for EACH row
execute FUNCTION sync_user_subscription_status ();

create trigger update_subscriptions_updated_at BEFORE
update on subscriptions for EACH row
execute FUNCTION update_updated_at_column ();