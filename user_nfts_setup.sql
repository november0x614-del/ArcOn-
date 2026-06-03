
-- user_nfts_setup.sql
-- Table to store minted NFTs per user natively on the server

CREATE TABLE IF NOT EXISTS user_nfts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image TEXT,
  tx_hash TEXT,
  contract_address TEXT,
  token_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE user_nfts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own NFTs"
  ON user_nfts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own NFTs"
  ON user_nfts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own NFTs"
  ON user_nfts FOR DELETE
  USING (auth.uid() = user_id);
