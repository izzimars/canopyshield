CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS schools (
  id serial UNIQUE,
  school_uuid text UNIQUE PRIMARY KEY DEFAULT ('sch' || gen_random_uuid()::text),
  name text NOT NULL,
  address text,
  contact_email text,
  lat numeric(10,7) NOT NULL,
  lng numeric(10,7) NOT NULL,
  current_risk_score integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id serial UNIQUE,
  user_uuid text UNIQUE PRIMARY KEY DEFAULT('user' || gen_random_uuid()::text),
  username text NOT NULL UNIQUE,
  school_id text,
  email text NOT NULL UNIQUE,
  hashed_password text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  verified_at timestamptz,
  push_subscription jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id serial UNIQUE,
  otp_uuid text UNIQUE PRIMARY KEY DEFAULT('otp' || gen_random_uuid()::text),
  user_id text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS risk_snapshots (
  id serial UNIQUE,
  risk_uuid text UNIQUE PRIMARY KEY DEFAULT('risk' || gen_random_uuid()::text),
  school_id text NOT NULL,
  heat_score integer NOT NULL,
  aqi_score integer NOT NULL,
  combined_score integer NOT NULL,
  raw_temp double precision NOT NULL,
  raw_humidity double precision NOT NULL,
  raw_uv double precision NOT NULL,
  raw_aqi integer NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS engagement_events (
  id serial UNIQUE,
  engagement_uuid text UNIQUE PRIMARY KEY DEFAULT('eng' || gen_random_uuid()::text),
  user_id text NOT NULL,
  school_id text NOT NULL,
  type text NOT NULL,
  points integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS school_points (
  id serial UNIQUE,
  points_uuid text UNIQUE DEFAULT('points' || gen_random_uuid()::text),
  school_id text PRIMARY KEY,
  total integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tree_requests (
  id serial UNIQUE,
  request_uuid text UNIQUE PRIMARY KEY DEFAULT('req' || gen_random_uuid()::text),
  school_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz
);

CREATE TABLE IF NOT EXISTS trees (
  id serial UNIQUE,
  tree_uuid text UNIQUE PRIMARY KEY DEFAULT('tree' || gen_random_uuid()::text),
  school_id text NOT NULL,
  request_id text,
  lat numeric(10,7),
  lng numeric(10,7),
  photo_url text,
  planted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS badges (
  id serial UNIQUE,
  badge_uuid text UNIQUE PRIMARY KEY DEFAULT('badge' || gen_random_uuid()::text),
  user_id text NOT NULL,
  type text NOT NULL,
  awarded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id serial UNIQUE,
  question_uuid text UNIQUE PRIMARY KEY DEFAULT('quiz' || gen_random_uuid()::text),
  question_text text NOT NULL,
  options jsonb NOT NULL,
  correct_index integer NOT NULL,
  topic_tag text NOT NULL,
  scheduled_date timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id serial UNIQUE,
  subscription_uuid text UNIQUE PRIMARY KEY DEFAULT('push' || gen_random_uuid()::text),
  user_id text NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alert_preferences (
  id serial UNIQUE,
  user_id text PRIMARY KEY,
  risk_threshold integer NOT NULL DEFAULT 60,
  channels text[] NOT NULL DEFAULT ARRAY['email']::text[],
  frequency text NOT NULL DEFAULT 'immediate',
  updated_at timestamptz NOT NULL DEFAULT now()
);

