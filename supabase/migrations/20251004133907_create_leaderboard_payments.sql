/*
  # Create leaderboard payments table

  1. New Tables
    - `leaderboard_payments`
      - `id` (bigint, primary key, auto-increment)
      - `user_id` (text, the identifier from localStorage)
      - `pseudo` (text, user's display name)
      - `avatar` (text, user's avatar URL)
      - `phrase` (text, user's personal phrase)
      - `amount_cents` (bigint, payment amount in cents)
      - `checkout_session_id` (text, Stripe checkout session ID)
      - `created_at` (timestamptz, creation timestamp)
      - `updated_at` (timestamptz, update timestamp)

  2. Security
    - Enable RLS on `leaderboard_payments` table
    - Add policy for public read access (anyone can see the leaderboard)
    - Only the webhook can insert payments (service role)
*/

CREATE TABLE IF NOT EXISTS leaderboard_payments (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id text NOT NULL,
  pseudo text NOT NULL,
  avatar text NOT NULL,
  phrase text DEFAULT '',
  amount_cents bigint NOT NULL,
  checkout_session_id text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE leaderboard_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read leaderboard payments"
  ON leaderboard_payments
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_leaderboard_payments_user_id ON leaderboard_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_payments_created_at ON leaderboard_payments(created_at DESC);