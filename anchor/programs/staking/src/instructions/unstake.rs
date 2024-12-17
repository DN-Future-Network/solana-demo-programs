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

pub fn unstake(ctx: Context<Unstake>, bump: u8, amount: u64) -> Result<()> {
    let staking_info = &mut ctx.accounts.staking_info;
    let user_info = &mut ctx.accounts.user_info;

    require!(amount > 0, StakingError::TokenAmountTooSmall);
    require!(
        amount <= user_info.staked_amount,
        StakingError::TokenAmountTooBig
    );

    // calculate pending reward
    let pending_reward = user_info.accumulated_reward(&staking_info);

    if amount == user_info.staked_amount {
        // Close userinfo account when unstake all
        let _ = user_info.close(ctx.accounts.authority.to_account_info());
    } else {
        user_info.staked_amount -= amount;
        user_info.pending_reward = 0;
        user_info.last_claimed_reward_at = Clock::get().unwrap().unix_timestamp;
    }

    // Update stake info
    staking_info.total_staked -= amount;

    // Transfer token to staked user
    let unstake_amount = amount + pending_reward;
    let _ = spl_token_2022::onchain::invoke_transfer_checked(
        ctx.accounts.token_program.key,
        ctx.accounts.staking_vault.to_account_info().clone(),
        ctx.accounts.mint_account.to_account_info().clone(),
        ctx.accounts
            .to_associated_token_account
            .to_account_info()
            .clone(),
        ctx.accounts.staking_info.to_account_info(),
        &[],
        unstake_amount,
        ctx.accounts.mint_account.decimals,
        &[&[STAKING_SEED, &[bump]][..]],
    );

    msg!("Unstake successfully.");

    Ok(())
}

pub fn claim_rewards(ctx: Context<ClaimRewards>, bump: u8) -> Result<()> {
    let staking_info = &mut ctx.accounts.staking_info;
    let user_info = &mut ctx.accounts.user_info;
    let now = Clock::get().unwrap().unix_timestamp;

    // get time and compare with start and end time
    require!(
        now >= staking_info.start_time,
        StakingError::StakingNotStarted
    );

    let pending_reward = user_info.accumulated_reward(&staking_info);
    if pending_reward > 0 {
        let _ = spl_token_2022::onchain::invoke_transfer_checked(
            ctx.accounts.token_program.key,
            ctx.accounts.staking_vault.to_account_info().clone(),
            ctx.accounts.mint_account.to_account_info().clone(),
            ctx.accounts
                .to_associated_token_account
                .to_account_info()
                .clone(),
            ctx.accounts.staking_info.to_account_info(),
            &[],
            pending_reward,
            ctx.accounts.mint_account.decimals,
            &[&[STAKING_SEED, &[bump]][..]],
        );

        // Update reward info
        user_info.pending_reward = 0;
        user_info.last_claimed_reward_at = now;
    }

    msg!("Claim rewards successfully.");

    Ok(())
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut)]
    pub mint_account: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint_account,
        associated_token::authority = authority,
        associated_token::token_program = token_program
    )]
    pub to_associated_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint_account,
        associated_token::authority = staking_info,
        associated_token::token_program = token_program
    )]
    pub staking_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
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

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(mut)]
    pub mint_account: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint_account,
        associated_token::authority = authority,
        associated_token::token_program = token_program
    )]
    pub to_associated_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint_account,
        associated_token::authority = staking_info,
        associated_token::token_program = token_program
    )]
    pub staking_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [USER_SEED, authority.key().as_ref()],
        bump
    )]
    pub user_info: Box<Account<'info, UserInfo>>,

    #[account(
        constraint = !staking_info.is_paused @ StakingError::StakingPaused,
        seeds = [STAKING_SEED],
        bump
    )]
    pub staking_info: Box<Account<'info, StakingInfo>>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
