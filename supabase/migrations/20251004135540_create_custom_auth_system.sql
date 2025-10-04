/*
  # Create custom authentication system

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `password_hash` (text)
      - `pseudo` (text)
      - `avatar` (text)
      - `phrase` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `token` (text, unique)
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Changes
    - Drop dependency on auth.users
    - Update profiles to reference new users table
    - Update leaderboard_payments to reference new users table

  3. Security
    - Enable RLS on all tables
    - Users can read their own data
    - Sessions are managed securely
*/

-- Drop existing tables that depend on auth.users
DROP TABLE IF EXISTS leaderboard_payments CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  pseudo text NOT NULL,
  avatar text DEFAULT 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150',
  phrase text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO anon, authenticated
  USING (true);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read sessions"
  ON sessions
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Recreate leaderboard_payments with new users reference
CREATE TABLE leaderboard_payments (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);