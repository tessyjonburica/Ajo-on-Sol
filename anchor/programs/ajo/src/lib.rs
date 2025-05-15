#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};

mod state;
mod error;

use state::*;
use error::*;

declare_id!("EiKhShgBVKz8bNY4eqAxQByS6CvsCeKVavxFhba38QFk");

#[program]
pub mod ajo {
    use super::*;

    pub fn create_pool(
        ctx: Context<CreatePool>,
        pool_id: u64,
        currency: CurrencyType,
        contribution_amount: u64,
        total_members: u8,
        total_cycles: u8,
        cycle_period: CyclePeriod,
        creator_position: u8,
        bump: u8,
    ) -> Result<()> {
        // Validate pool parameters
        require!(total_members <= 10, AjoError::InvalidPoolSize);
        require!(total_members >= 2, AjoError::InvalidPoolSize);
        require!(contribution_amount > 0, AjoError::InvalidContribution);
        require!(total_cycles > 0, AjoError::InvalidCyclePeriod);
        require!(creator_position > 0 && creator_position <= total_members, AjoError::InvalidPayoutPosition);

        let pool = &mut ctx.accounts.pool;
        pool.creator = ctx.accounts.creator.key();
        pool.pool_id = pool_id;
        pool.currency = currency;
        pool.contribution_amount = contribution_amount;
        pool.total_members = total_members;
        pool.member_count = 1; // Creator is first member
        pool.member_pubkeys = vec![ctx.accounts.creator.key()];
        pool.payout_order = vec![(ctx.accounts.creator.key(), creator_position)];
        pool.current_cycle = 0;
        pool.total_cycles = total_cycles;
        pool.cycle_period = cycle_period;
        pool.last_contribution_time = 0; // Will be set when pool becomes active
        pool.active = false;
        pool.bump = bump;

        // Create member account for pool creator
        let member = &mut ctx.accounts.member;
        member.wallet = ctx.accounts.creator.key();
        member.pool = pool.key();
        member.has_collected = false;
        member.contributions_made = 0;
        member.payout_position = creator_position;
        member.questionnaire_answers = vec![];
        member.bump = ctx.bumps.member;

        Ok(())
    }

    pub fn join_pool(
        ctx: Context<JoinPool>,
        payout_position: u8,
        questionnaire_answers: Vec<String>,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        
        // Validate pool state
        require!(!pool.active, AjoError::PoolActive);
        require!(pool.member_count < pool.total_members, AjoError::PoolFull);
        require!(
            !pool.member_pubkeys.contains(&ctx.accounts.user.key()),
            AjoError::MemberExists
        );

        // Validate payout position
        require!(
            payout_position > 0 && payout_position <= pool.total_members,
            AjoError::InvalidPayoutPosition
        );
        require!(
            !pool.payout_order.iter().any(|(_, pos)| *pos == payout_position),
            AjoError::PayoutPositionTaken
        );

        // Update pool state
        pool.member_pubkeys.push(ctx.accounts.user.key());
        pool.payout_order.push((ctx.accounts.user.key(), payout_position));
        pool.member_count += 1;

        // Initialize member account
        let member = &mut ctx.accounts.member;
        member.wallet = ctx.accounts.user.key();
        member.pool = pool.key();
        member.has_collected = false;
        member.contributions_made = 0;
        member.payout_position = payout_position;
        member.questionnaire_answers = questionnaire_answers;
        member.bump = ctx.bumps.member;

        // If all members have joined, activate the pool
        if pool.member_count == pool.total_members {
            // Sort payout_order by position
            pool.payout_order.sort_by_key(|(_, pos)| *pos);
            pool.active = true;
        }

        Ok(())
    }

    pub fn make_contribution(ctx: Context<MakeContribution>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let member = &mut ctx.accounts.member;
        let now = Clock::get()?.unix_timestamp;
        
        require!(pool.active, AjoError::PoolNotActive);
        require!(member.contributions_made < pool.total_cycles, AjoError::ContributionAlreadyMade);
        
        // Check if enough time has passed since last contribution
        if pool.last_contribution_time > 0 {
            let time_since_last = now - pool.last_contribution_time;
            let required_interval = match pool.cycle_period {
                CyclePeriod::Weekly => 7 * 24 * 60 * 60, // 7 days in seconds
                CyclePeriod::Monthly => 30 * 24 * 60 * 60, // 30 days in seconds (approximate)
            };
            require!(time_since_last >= required_interval, AjoError::ContributionAlreadyMade);
        }
        
        match pool.currency {
            CurrencyType::SOL => {
                let ix = anchor_lang::solana_program::system_instruction::transfer(
                    &ctx.accounts.user.key(),
                    &ctx.accounts.vault.key(),
                    pool.contribution_amount,
                );
                
                anchor_lang::solana_program::program::invoke(
                    &ix,
                    &[
                        ctx.accounts.user.to_account_info(),
                        ctx.accounts.vault.to_account_info(),
                    ],
                )?;
            },
            CurrencyType::USDC => {
                let cpi_ctx = CpiContext::new(
                    ctx.accounts.token_program.as_ref().expect("Token program required").to_account_info(),
                    token::Transfer {
                        from: ctx.accounts.user_token.as_ref().expect("User token account required").to_account_info(),
                        to: ctx.accounts.vault_token.as_ref().expect("Vault token account required").to_account_info(),
                        authority: ctx.accounts.user.to_account_info(),
                    },
                );
                token::transfer(cpi_ctx, pool.contribution_amount)?;
            }
        }
        
        member.contributions_made += 1;
        pool.last_contribution_time = now;
        
        Ok(())
    }

    pub fn execute_payout(ctx: Context<ExecutePayout>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let recipient = &mut ctx.accounts.recipient;
        
        require!(pool.active, AjoError::PoolNotActive);
        
        // Verify recipient is next in line
        let expected_recipient = pool.payout_order[pool.current_cycle as usize].0;
        require!(
            recipient.wallet == expected_recipient,
            AjoError::InvalidPayoutRecipient
        );
        
        // Calculate payout amount
        let payout_amount = pool.contribution_amount * pool.total_members as u64;
        
        match pool.currency {
            CurrencyType::SOL => {
                **ctx.accounts.vault.to_account_info().try_borrow_mut_lamports()? -= payout_amount;
                **ctx.accounts.recipient_wallet.try_borrow_mut_lamports()? += payout_amount;
            },
            CurrencyType::USDC => {
                let seeds = &[
                    b"vault".as_ref(),
                    pool.to_account_info().key.as_ref(),
                    &[ctx.accounts.vault.bump],
                ];
                let signer = &[&seeds[..]];
                
                let cpi_ctx = CpiContext::new_with_signer(
                    ctx.accounts.token_program.as_ref().expect("Token program required").to_account_info(),
                    token::Transfer {
                        from: ctx.accounts.vault_token.as_ref().expect("Vault token account required").to_account_info(),
                        to: ctx.accounts.recipient_token.as_ref().expect("Recipient token account required").to_account_info(),
                        authority: ctx.accounts.vault.to_account_info(),
                    },
                    signer,
                );
                token::transfer(cpi_ctx, payout_amount)?;
            }
        }
        
        recipient.has_collected = true;
        pool.current_cycle += 1;
        
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(pool_id: u64, bump: u8)]
pub struct CreatePool<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + 32 + 8 + 1 + 8 + 1 + 1 + (32 * 10) + (32 * 10) + 1 + 1 + 1 + 8 + 1 + 1 + 1,
        seeds = [b"pool", creator.key().as_ref(), pool_id.to_le_bytes().as_ref()],
        bump
    )]
    pub pool: Account<'info, PoolAccount>,
    
    #[account(
        init,
        payer = creator,
        space = 8 + std::mem::size_of::<MemberAccount>() + 256, // Extra space for questionnaire
        seeds = [b"member", pool.key().as_ref(), creator.key().as_ref()],
        bump
    )]
    pub member: Account<'info, MemberAccount>,

    #[account(
        init,
        payer = creator,
        space = 8 + std::mem::size_of::<VaultAccount>(),
        seeds = [b"vault", pool.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, VaultAccount>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinPool<'info> {
    #[account(mut)]
    pub pool: Account<'info, PoolAccount>,
    
    #[account(
        init,
        payer = user,
        space = 8 + std::mem::size_of::<MemberAccount>() + 256,
        seeds = [b"member", pool.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub member: Account<'info, MemberAccount>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MakeContribution<'info> {
    #[account(mut)]
    pub pool: Account<'info, PoolAccount>,
    
    #[account(
        mut,
        seeds = [b"member", pool.key().as_ref(), user.key().as_ref()],
        bump = member.bump,
    )]
    pub member: Account<'info, MemberAccount>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    /// CHECK: Vault for holding bonds and contributions
    #[account(mut)]
    pub vault: AccountInfo<'info>,
    
    #[account(mut)]
    pub user_token: Option<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub vault_token: Option<Account<'info, TokenAccount>>,
    pub token_program: Option<Program<'info, Token>>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecutePayout<'info> {
    #[account(mut)]
    pub pool: Account<'info, PoolAccount>,
    
    #[account(
        mut,
        seeds = [b"member", pool.key().as_ref(), recipient_wallet.key().as_ref()],
        bump = recipient.bump,
    )]
    pub recipient: Account<'info, MemberAccount>,
    
    /// CHECK: Recipient wallet to receive payout
    #[account(mut)]
    pub recipient_wallet: AccountInfo<'info>,
    
    /// CHECK: Vault holding funds
    #[account(mut)]
    pub vault: Account<'info, VaultAccount>,
    
    #[account(mut)]
    pub vault_token: Option<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub recipient_token: Option<Account<'info, TokenAccount>>,
    pub token_program: Option<Program<'info, Token>>,
    pub system_program: Program<'info, System>,
} 