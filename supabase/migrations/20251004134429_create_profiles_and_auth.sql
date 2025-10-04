/*
  # Create user profiles and update leaderboard

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `pseudo` (text, user's display name)
      - `avatar` (text, user's avatar URL)
      - `phrase` (text, user's personal phrase)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes
    - Update `leaderboard_payments` to use `user_id` as uuid referencing auth.users
    - Add a function to automatically create profile on user signup

  3. Security
    - Enable RLS on `profiles` table
    - Users can read all profiles (for leaderboard)
    - Users can only update their own profile
    - Auto-create profile on signup via trigger
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pseudo text NOT NULL,
  avatar text NOT NULL DEFAULT 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150',
  phrase text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read profiles"
  ON profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Drop and recreate leaderboard_payments with proper user_id reference
DROP TABLE IF EXISTS leaderboard_payments;

CREATE TABLE leaderboard_payments (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, pseudo, avatar, phrase)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'pseudo', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar', 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150'),
    COALESCE(new.raw_user_meta_data->>'phrase', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();