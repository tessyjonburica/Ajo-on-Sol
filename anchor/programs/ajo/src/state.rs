use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum CurrencyType {
    SOL,
    USDC,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum CyclePeriod {
    Weekly,
    Monthly,
}

impl Default for CurrencyType {
    fn default() -> Self {
        CurrencyType::SOL
    }
}

impl Default for CyclePeriod {
    fn default() -> Self {
        CyclePeriod::Monthly
    }
}

#[account]
#[derive(Default)]
pub struct PoolAccount {
    pub creator: Pubkey,            // 32 bytes
    pub pool_id: u64,               // 8 bytes
    pub currency: CurrencyType,     // 1 byte
    pub contribution_amount: u64,    // 8 bytes
    pub total_members: u8,          // 1 byte
    pub member_count: u8,           // 1 byte
    pub member_pubkeys: Vec<Pubkey>, // Dynamic
    pub payout_order: Vec<(Pubkey, u8)>,  // Dynamic - (member, position)
    pub current_cycle: u8,          // 1 byte
    pub total_cycles: u8,           // 1 byte (e.g., 52 for weekly for 1 year)
    pub cycle_period: CyclePeriod,  // 1 byte
    pub last_contribution_time: i64, // 8 bytes (unix timestamp)
    pub active: bool,               // 1 byte
    pub bump: u8,                   // 1 byte for PDA
}

#[account]
#[derive(Default)]
pub struct MemberAccount {
    pub wallet: Pubkey,             // 32 bytes
    pub pool: Pubkey,               // 32 bytes
    pub has_collected: bool,        // 1 byte
    pub contributions_made: u8,     // 1 byte
    pub payout_position: u8,        // 1 byte - Position in payout order
    pub questionnaire_answers: Vec<String>, // Dynamic
    pub bump: u8,                   // 1 byte for PDA
}

#[account]
pub struct VaultAccount {
    pub pool: Pubkey,               // 32 bytes
    pub amount: u64,                // 8 bytes
    pub bump: u8,                   // 1 byte
} 