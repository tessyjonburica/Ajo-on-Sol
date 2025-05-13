-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE penalties ENABLE ROW LEVEL SECURITY;

-- Users Table Policies
CREATE POLICY "Users can view their own data"
ON users FOR SELECT
USING (wallet_address = auth.uid()::text);

CREATE POLICY "Users can update their own data"
ON users FOR UPDATE
USING (wallet_address = auth.uid()::text);

-- Pools Table Policies
CREATE POLICY "Anyone can view pools"
ON pools FOR SELECT
USING (true);

CREATE POLICY "Users can create pools"
ON pools FOR INSERT
WITH CHECK (creator_wallet = auth.uid()::text);

CREATE POLICY "Pool creators can update their pools"
ON pools FOR UPDATE
USING (creator_wallet = auth.uid()::text);

-- Pool Members Table Policies
CREATE POLICY "Users can view pool members"
ON pool_members FOR SELECT
USING (true);

CREATE POLICY "Users can join pools"
ON pool_members FOR INSERT
WITH CHECK (wallet_address = auth.uid()::text);

CREATE POLICY "Users can update their own membership"
ON pool_members FOR UPDATE
USING (wallet_address = auth.uid()::text);

-- Contributions Table Policies
CREATE POLICY "Users can view contributions"
ON contributions FOR SELECT
USING (true);

CREATE POLICY "Users can create their own contributions"
ON contributions FOR INSERT
WITH CHECK (wallet_address = auth.uid()::text);

-- Payouts Table Policies
CREATE POLICY "Users can view payouts"
ON payouts FOR SELECT
USING (true);

CREATE POLICY "Pool creators can create payouts"
ON payouts FOR INSERT
WITH CHECK (pool_id IN (
  SELECT id FROM pools WHERE creator_wallet = auth.uid()::text
));

-- Proposals Table Policies
CREATE POLICY "Users can view proposals"
ON proposals FOR SELECT
USING (true);

CREATE POLICY "Pool members can create proposals"
ON proposals FOR INSERT
WITH CHECK (proposer_wallet = auth.uid()::text);

CREATE POLICY "Proposers can update their proposals"
ON proposals FOR UPDATE
USING (proposer_wallet = auth.uid()::text);

-- Votes Table Policies
CREATE POLICY "Users can view votes"
ON votes FOR SELECT
USING (true);

CREATE POLICY "Pool members can vote on proposals"
ON votes FOR INSERT
WITH CHECK (wallet_address = auth.uid()::text);

-- Penalties Table Policies
CREATE POLICY "Users can view penalties"
ON penalties FOR SELECT
USING (true);

CREATE POLICY "Pool creators can create penalties"
ON penalties FOR INSERT
WITH CHECK (pool_id IN (
  SELECT id FROM pools WHERE creator_wallet = auth.uid()::text
));

CREATE POLICY "Users can pay their own penalties"
ON penalties FOR UPDATE
USING (wallet_address = auth.uid()::text);
