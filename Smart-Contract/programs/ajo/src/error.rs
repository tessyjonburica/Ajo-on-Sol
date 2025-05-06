use anchor_lang::prelude::*;

#[error_code]
pub enum AjoError {
    #[msg("Pool is already full")]
    PoolFull,
    #[msg("Member already exists in pool")]
    MemberExists,
    #[msg("Invalid contribution amount")]
    InvalidContribution,
    #[msg("Member not found")]
    MemberNotFound,
    #[msg("Pool not active")]
    PoolNotActive,
    #[msg("Pool is already active")]
    PoolActive,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid pool size - must be between 2 and 10 members")]
    InvalidPoolSize,
    #[msg("Insufficient funds for contribution")]
    InsufficientFunds,
    #[msg("Invalid payout recipient")]
    InvalidPayoutRecipient,
    #[msg("Invalid cycle period or total cycles")]
    InvalidCyclePeriod,
    #[msg("Contribution already made for this cycle")]
    ContributionAlreadyMade,
    #[msg("Invalid payout position - must be between 1 and total members")]
    InvalidPayoutPosition,
    #[msg("Payout position already taken")]
    PayoutPositionTaken,
} 