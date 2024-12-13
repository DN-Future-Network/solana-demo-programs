use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
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
    user_info.holder = ctx.accounts.staker.key();
    user_info.staked_amount += amount;
    user_info.last_claimed_reward_at = now;

    staking_info.total_staked += amount;

    // Transfer token to staking vault
    let cpi_accounts = TransferChecked {
        from: ctx
            .accounts
            .from_associated_token_account
            .to_account_info()
            .clone(),
        mint: ctx.accounts.mint_account.to_account_info().clone(),
        to: ctx.accounts.staking_vault.to_account_info().clone(),
        authority: ctx.accounts.staker.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
    transfer_checked(cpi_context, amount, ctx.accounts.mint_account.decimals)?;
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
        associated_token::authority = staker,
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
        payer = staker,
        space = 8 + std::mem::size_of::<UserInfo>(),
        seeds = [USER_SEED, staker.key().as_ref()],
        bump
    )]
    pub user_info: Box<Account<'info, UserInfo>>,

    #[account(
        mut,
        seeds = [STAKING_SEED],
        bump
    )]
    pub staking_info: Box<Account<'info, StakingInfo>>,

    #[account(mut)]
    pub staker: Signer<'info>,

    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
