-- Stored procedure for joining a pool with transaction safety
CREATE OR REPLACE FUNCTION join_pool_transaction(
  p_pool_id UUID,
  p_user_id UUID,
  p_position INT
)
RETURNS VOID AS $$
DECLARE
  v_current_members INT;
  v_total_members INT;
BEGIN
  -- Start a transaction
  BEGIN
    -- Lock the pool row for update
    SELECT current_members, total_members INTO v_current_members, v_total_members
    FROM pools
    WHERE id = p_pool_id
    FOR UPDATE;
    
    -- Check if the pool is full
    IF v_current_members >= v_total_members THEN
      RAISE EXCEPTION 'Pool is already full';
    END IF;
    
    -- Check if the user is already a member
    IF EXISTS (
      SELECT 1 FROM pool_members
      WHERE pool_id = p_pool_id AND user_id = p_user_id
    ) THEN
      RAISE EXCEPTION 'User is already a member of this pool';
    END IF;
    
    -- Add the user as a member
    INSERT INTO pool_members (
      pool_id,
      user_id,
      position,
      has_received_payout,
      total_contributed,
      status
    ) VALUES (
      p_pool_id,
      p_user_id,
      p_position,
      false,
      0,
      'active'
    );
    
    -- Update the pool's current members count
    UPDATE pools
    SET 
      current_members = current_members + 1,
      updated_at = NOW()
    WHERE id = p_pool_id;
    
    -- Commit the transaction
    COMMIT;
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback the transaction on error
      ROLLBACK;
      RAISE;
  END;
END;
$$ LANGUAGE plpgsql;

-- Stored procedure for processing a payout with transaction safety
CREATE OR REPLACE FUNCTION process_payout_transaction(
  p_pool_id UUID,
  p_recipient_id UUID,
  p_amount NUMERIC,
  p_transaction_signature TEXT
)
RETURNS VOID AS $$
DECLARE
  v_token TEXT;
  v_token_symbol TEXT;
  v_next_recipient_id UUID;
  v_next_payout_date TIMESTAMP;
  v_frequency TEXT;
BEGIN
  -- Start a transaction
  BEGIN
    -- Lock the pool row for update
    SELECT 
      contribution_token,
      contribution_token_symbol,
      frequency
    INTO 
      v_token,
      v_token_symbol,
      v_frequency
    FROM pools
    WHERE id = p_pool_id
    FOR UPDATE;
    
    -- Record the payout
    INSERT INTO payouts (
      pool_id,
      recipient_id,
      amount,
      token,
      token_symbol,
      transaction_signature,
      status,
      payout_date
    ) VALUES (
      p_pool_id,
      p_recipient_id,
      p_amount,
      v_token,
      v_token_symbol,
      p_transaction_signature,
      'confirmed',
      NOW()
    );
    
    -- Update the recipient's record to mark they've received a payout
    UPDATE pool_members
    SET 
      has_received_payout = true,
      updated_at = NOW()
    WHERE pool_id = p_pool_id AND user_id = p_recipient_id;
    
    -- Determine the next recipient in the rotation
    SELECT user_id INTO v_next_recipient_id
    FROM pool_members
    WHERE pool_id = p_pool_id AND status = 'active' AND position > (
      SELECT position FROM pool_members
      WHERE pool_id = p_pool_id AND user_id = p_recipient_id
    )
    ORDER BY position
    LIMIT 1;
    
    -- If no next recipient (end of rotation), start from the beginning
    IF v_next_recipient_id IS NULL THEN
      SELECT user_id INTO v_next_recipient_id
      FROM pool_members
      WHERE pool_id = p_pool_id AND status = 'active'
      ORDER BY position
      LIMIT 1;
    END IF;
    
    -- Calculate the next payout date based on frequency
    CASE v_frequency
      WHEN 'daily' THEN
        v_next_payout_date := NOW() + INTERVAL '1 day';
      WHEN 'weekly' THEN
        v_next_payout_date := NOW() + INTERVAL '7 days';
      WHEN 'biweekly' THEN
        v_next_payout_date := NOW() + INTERVAL '14 days';
      WHEN 'monthly' THEN
        v_next_payout_date := NOW() + INTERVAL '1 month';
      ELSE
        v_next_payout_date := NOW() + INTERVAL '7 days';
    END CASE;
    
    -- Update the pool with the next payout information
    UPDATE pools
    SET 
      next_payout_member_id = v_next_recipient_id,
      next_payout_date = v_next_payout_date,
      updated_at = NOW()
    WHERE id = p_pool_id;
    
    -- Commit the transaction
    COMMIT;
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback the transaction on error
      ROLLBACK;
      RAISE;
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to check and process proposals that have ended
CREATE OR REPLACE FUNCTION check_ended_proposals()
RETURNS VOID AS $$
DECLARE
  proposal_record RECORD;
  yes_votes INT;
  no_votes INT;
  total_votes INT;
  has_passed BOOLEAN;
BEGIN
  -- Find all active proposals that have ended
  FOR proposal_record IN
    SELECT p.* 
    FROM proposals p
    WHERE p.status = 'active' AND p.ends_at < NOW()
  LOOP
    -- Count the votes
    SELECT 
      COUNT(CASE WHEN vote = 'yes' THEN 1 END),
      COUNT(CASE WHEN vote = 'no' THEN 1 END),
      COUNT(*)
    INTO 
      yes_votes,
      no_votes,
      total_votes
    FROM votes
    WHERE proposal_id = proposal_record.id;
    
    -- Check if the proposal has passed (simple majority)
    has_passed := yes_votes > no_votes AND total_votes > 0;
    
    -- Update the proposal status
    UPDATE proposals
    SET 
      status = CASE WHEN has_passed THEN 'passed' ELSE 'rejected' END,
      updated_at = NOW()
    WHERE id = proposal_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a cron job to check ended proposals every hour
SELECT cron.schedule(
  'check-ended-proposals',
  '0 * * * *', -- Run every hour
  'SELECT check_ended_proposals()'
);
