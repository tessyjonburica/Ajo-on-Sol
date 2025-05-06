-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE penalties ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own data"
ON users FOR SELECT
USING (privy_id = auth.uid());

CREATE POLICY "Users can update their own data"
ON users FOR UPDATE
USING (privy_id = auth.uid());

-- Create policies for pools table
CREATE POLICY "Anyone can view pools"
ON pools FOR SELECT
USING (true);

CREATE POLICY "Users can create pools"
ON pools FOR INSERT
WITH CHECK (creator_id IN (
  SELECT id FROM users WHERE privy_id = auth.uid()
));

CREATE POLICY "Pool creators can update their pools"
ON pools FOR UPDATE
USING (creator_id IN (
  SELECT id FROM users WHERE privy_id = auth.uid()
));

-- Create policies for pool_members table
CREATE POLICY "Users can view pool members"
ON pool_members FOR SELECT
USING (true);

CREATE POLICY "Users can join pools"
ON pool_members FOR INSERT
WITH CHECK (user_id IN (
  SELECT id FROM users WHERE privy_id = auth.uid()
));

CREATE POLICY "Users can update their own membership"
ON pool_members FOR UPDATE
USING (user_id IN (
  SELECT id FROM users WHERE privy_id = auth.uid()
) OR pool_id IN (
  SELECT id FROM pools WHERE creator_id IN (
    SELECT id FROM users WHERE privy_id = auth.uid()
  )
));

-- Create policies for contributions table
CREATE POLICY "Users can view contributions"
ON contributions FOR SELECT
USING (true);

CREATE POLICY "Users can create their own contributions"
ON contributions FOR INSERT
WITH CHECK (user_id IN (
  SELECT id FROM users WHERE privy_id = auth.uid()
));

-- Create policies for payouts table
CREATE POLICY "Users can view payouts"
ON payouts FOR SELECT
USING (true);

CREATE POLICY "Pool creators can create payouts"
ON payouts FOR INSERT
WITH CHECK (pool_id IN (
  SELECT id FROM pools WHERE creator_id IN (
    SELECT id FROM users WHERE privy_id = auth.uid()
  )
));

-- Create policies for proposals table
CREATE POLICY "Users can view proposals"
ON proposals FOR SELECT
USING (true);

CREATE POLICY "Pool members can create proposals"
ON proposals FOR INSERT
WITH CHECK (pool_id IN (
  SELECT pool_id FROM pool_members WHERE user_id IN (
    SELECT id FROM users WHERE privy_id = auth.uid()
  )
));

CREATE POLICY "Proposers can update their proposals"
ON proposals FOR UPDATE
USING (proposer_id IN (
  SELECT id FROM users WHERE privy_id = auth.uid()
) OR pool_id IN (
  SELECT id FROM pools WHERE creator_id IN (
    SELECT id FROM users WHERE privy_id = auth.uid()
  )
));

-- Create policies for votes table
CREATE POLICY "Users can view votes"
ON votes FOR SELECT
USING (true);

CREATE POLICY "Pool members can vote on proposals"
ON votes FOR INSERT
WITH CHECK (user_id IN (
  SELECT id FROM users WHERE privy_id = auth.uid()
) AND proposal_id IN (
  SELECT id FROM proposals WHERE pool_id IN (
    SELECT pool_id FROM pool_members WHERE user_id IN (
      SELECT id FROM users WHERE privy_id = auth.uid()
    )
  )
));

CREATE POLICY "Users can update their own votes"
ON votes FOR UPDATE
USING (user_id IN (
  SELECT id FROM users WHERE privy_id = auth.uid()
));

-- Create policies for penalties table
CREATE POLICY "Users can view penalties"
ON penalties FOR SELECT
USING (true);

CREATE POLICY "Pool creators can create penalties"
ON penalties FOR INSERT
WITH CHECK (pool_id IN (
  SELECT id FROM pools WHERE creator_id IN (
    SELECT id FROM users WHERE privy_id = auth.uid()
  )
));

CREATE POLICY "Users can pay their own penalties"
ON penalties FOR UPDATE
USING (user_id IN (
  SELECT id FROM users WHERE privy_id = auth.uid()
) OR pool_id IN (
  SELECT id FROM pools WHERE creator_id IN (
    SELECT id FROM users WHERE privy_id = auth.uid()
  )
));
