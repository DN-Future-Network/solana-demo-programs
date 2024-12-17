use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::spl_token_2022,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::constants::{STAKING_SEED, USER_SEED};
use crate::errors::StakingError;
use crate::state::StakingInfo;
use crate::state::UserInfo;

pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
    let staking_info = &mut ctx.accounts.staking_info;
    let user_info = &mut ctx.accounts.user_info;
    let now = Clock::get().unwrap().unix_timestamp;

    // get time and compare with start and end time
    require!(
        now >= staking_info.start_time,
        StakingError::StakingNotStarted
    );
    require!(now <= staking_info.end_time, StakingError::StakingEnded);
    require!(amount > 0, StakingError::TokenAmountTooSmall);

    // limit the token amount per address
    require!(
        user_info.staked_amount + amount <= staking_info.max_token_amount_per_address,
        StakingError::ReachMaxStake
    );

    // Update pending reward
    user_info.pending_reward = user_info.accumulated_reward(&staking_info);

    // Update the stake info
    user_info.authority = ctx.accounts.authority.key();
    user_info.staked_amount += amount;
    user_info.last_claimed_reward_at = now;

    staking_info.total_staked += amount;

    // Transfer token to staking vault
    let _ = spl_token_2022::onchain::invoke_transfer_checked(
        ctx.accounts.token_program.key,
        ctx.accounts
            .from_associated_token_account
            .to_account_info()
            .clone(),
        ctx.accounts.mint_account.to_account_info().clone(),
        ctx.accounts.staking_vault.to_account_info().clone(),
        ctx.accounts.authority.to_account_info(),
        &[],
        amount,
        ctx.accounts.mint_account.decimals,
        &[],
    );

    msg!("Stake successfully.");

    Ok(())
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub mint_account: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint_account,
        associated_token::authority = authority,
        associated_token::token_program = token_program
    )]
    pub from_associated_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint_account,
        associated_token::authority = staking_info,
        associated_token::token_program = token_program
    )]
    pub staking_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + std::mem::size_of::<UserInfo>(),
        seeds = [USER_SEED, authority.key().as_ref()],
        bump
    )]
    pub user_info: Box<Account<'info, UserInfo>>,

    #[account(
        mut,
        constraint = !staking_info.is_paused @ StakingError::StakingPaused,
        seeds = [STAKING_SEED],
        bump
    )]
    pub staking_info: Box<Account<'info, StakingInfo>>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
