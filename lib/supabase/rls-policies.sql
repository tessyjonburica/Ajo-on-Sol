-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE penalties ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts when re-running)
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Authenticated users can view public user profiles" ON users;
DROP POLICY IF EXISTS "Anyone can view pools" ON pools;
DROP POLICY IF EXISTS "Users can create pools" ON pools;
DROP POLICY IF EXISTS "Pool creators can update their pools" ON pools;
DROP POLICY IF EXISTS "Users can view pool members" ON pool_members;
DROP POLICY IF EXISTS "Users can join pools" ON pool_members;
DROP POLICY IF EXISTS "Users can update their own membership" ON pool_members;
DROP POLICY IF EXISTS "Users can view contributions" ON contributions;
DROP POLICY IF EXISTS "Users can create their own contributions" ON contributions;
DROP POLICY IF EXISTS "Users can view payouts" ON payouts;
DROP POLICY IF EXISTS "Pool creators can create payouts" ON payouts;
DROP POLICY IF EXISTS "Users can view proposals" ON proposals;
DROP POLICY IF EXISTS "Pool members can create proposals" ON proposals;
DROP POLICY IF EXISTS "Proposers can update their proposals" ON proposals;
DROP POLICY IF EXISTS "Users can view votes" ON votes;
DROP POLICY IF EXISTS "Pool members can vote on proposals" ON votes;
DROP POLICY IF EXISTS "Users can view penalties" ON penalties;
DROP POLICY IF EXISTS "Pool creators can create penalties" ON penalties;
DROP POLICY IF EXISTS "Users can pay their own penalties" ON penalties;

-- Users Table Policies
CREATE POLICY "Users can view their own data"
ON users FOR SELECT
USING (wallet_address = auth.jwt() ->> 'sub');

CREATE POLICY "Authenticated users can view public user profiles"
ON users FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own data"
ON users FOR UPDATE
USING (wallet_address = auth.jwt() ->> 'sub')
WITH CHECK (wallet_address = auth.jwt() ->> 'sub');

-- Pools Table Policies
CREATE POLICY "Anyone can view pools"
ON pools FOR SELECT
USING (true);

CREATE POLICY "Users can create pools"
ON pools FOR INSERT
WITH CHECK (creator_id IN (
  SELECT id FROM users WHERE wallet_address = auth.jwt() ->> 'sub'
));

CREATE POLICY "Pool creators can update their pools"
ON pools FOR UPDATE
USING (creator_id IN (
  SELECT id FROM users WHERE wallet_address = auth.jwt() ->> 'sub'
));

-- Pool Members Table Policies
CREATE POLICY "Users can view pool members"
ON pool_members FOR SELECT
USING (true);

CREATE POLICY "Users can join pools"
ON pool_members FOR INSERT
WITH CHECK (user_id IN (
  SELECT id FROM users WHERE wallet_address = auth.jwt() ->> 'sub'
));

CREATE POLICY "Users can update their own membership"
ON pool_members FOR UPDATE
USING (user_id IN (
  SELECT id FROM users WHERE wallet_address = auth.jwt() ->> 'sub'
) OR pool_id IN (
  SELECT id FROM pools WHERE creator_id IN (
    SELECT id FROM users WHERE wallet_address = auth.jwt() ->> 'sub'
  )
));

-- Contributions Table Policies
CREATE POLICY "Users can view contributions"
ON contributions FOR SELECT
USING (true);

CREATE POLICY "Users can create their own contributions"
ON contributions FOR INSERT
WITH CHECK (user_id IN (
  SELECT id FROM users WHERE wallet_address = auth.jwt() ->> 'sub'
));

-- Payouts Table Policies
CREATE POLICY "Users can view payouts"
ON payouts FOR SELECT
USING (true);

CREATE POLICY "Pool creators can create payouts"
ON payouts FOR INSERT
WITH CHECK (pool_id IN (
  SELECT id FROM pools WHERE creator_id IN (
    SELECT id FROM users WHERE wallet_address = auth.jwt() ->> 'sub'
  )
));

-- Proposals Table Policies
CREATE POLICY "Users can view proposals"
ON proposals FOR SELECT
USING (true);

CREATE POLICY "Pool members can create proposals"
ON proposals FOR INSERT
WITH CHECK (proposer_id IN (
  SELECT id FROM users WHERE wallet_address = auth.jwt() ->> 'sub'
));

CREATE POLICY "Proposers can update their proposals"
ON proposals FOR UPDATE
USING (proposer_id IN (
  SELECT id FROM users WHERE wallet_address = auth.jwt() ->> 'sub'
) OR pool_id IN (
  SELECT id FROM pools WHERE creator_id IN (
    SELECT id FROM users WHERE wallet_address = auth.jwt() ->> 'sub'
  )
));

-- Votes Table Policies
CREATE POLICY "Users can view votes"
ON votes FOR SELECT
USING (true);

CREATE POLICY "Pool members can vote on proposals"
ON votes FOR INSERT
WITH CHECK (user_id IN (
  SELECT id FROM users WHERE wallet_address = auth.jwt() ->> 'sub'
));

CREATE POLICY "Users can update their own votes"
ON votes FOR UPDATE
USING (user_id IN (
  SELECT id FROM users WHERE wallet_address = auth.jwt() ->> 'sub'
));

-- Penalties Table Policies
CREATE POLICY "Users can view penalties"
ON penalties FOR SELECT
USING (true);

CREATE POLICY "Pool creators can create penalties"
ON penalties FOR INSERT
WITH CHECK (pool_id IN (
  SELECT id FROM pools WHERE creator_id IN (
    SELECT id FROM users WHERE wallet_address = auth.jwt() ->> 'sub'
  )
));

CREATE POLICY "Users can pay their own penalties"
ON penalties FOR UPDATE
USING (user_id IN (
  SELECT id FROM users WHERE wallet_address = auth.jwt() ->> 'sub'
) OR pool_id IN (
  SELECT id FROM pools WHERE creator_id IN (
    SELECT id FROM users WHERE wallet_address = auth.jwt() ->> 'sub'
  )
));
