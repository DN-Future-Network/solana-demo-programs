use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};

use crate::constants::{STAKING_SEED, USER_SEED};
use crate::errors::StakingError;
use crate::state::StakingInfo;
use crate::state::UserInfo;

pub fn unstake(ctx: Context<Unstake>, bump: u8, amount: u64) -> Result<()> {
    let staking_info = &mut ctx.accounts.staking_info;
    let user_info = &mut ctx.accounts.user_info;

    require!(amount > 0, StakingError::TokenAmountTooSmall);

    if amount == user_info.staked_amount {
        return Err(StakingError::UnstakeAllInstead.into());
    }

    require!(amount < user_info.staked_amount, StakingError::TokenAmountTooBig);


    // calculate pending reward
    let pending_reward = user_info.accumulated_reward(&staking_info);

    // Update stake info
    staking_info.total_staked -= amount;
    user_info.staked_amount -= amount;
    user_info.pending_reward = 0;
    user_info.last_claimed_reward_at = Clock::get().unwrap().unix_timestamp;

    // Transfer token to staked user
    let unstake_amount = amount + pending_reward;
    if unstake_amount > 0 {
        let cpi_accounts = TransferChecked {
            from: ctx.accounts.staking_vault.to_account_info().clone(),
            mint: ctx.accounts.mint_account.to_account_info().clone(),
            to: ctx
                .accounts
                .to_associated_token_account
                .to_account_info()
                .clone(),
            authority: ctx.accounts.staking_info.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let seeds = &[STAKING_SEED, &[bump]];
        let signer_seeds = &[&seeds[..]];
        let cpi_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        transfer_checked(
            cpi_context,
            unstake_amount,
            ctx.accounts.mint_account.decimals,
        )?;
    }

    msg!("Unstake successfully.");

    Ok(())
}

pub fn unstake_all(ctx: Context<UnstakeAll>, bump: u8) -> Result<()> {
    let staking_info = &mut ctx.accounts.staking_info;
    let user_info = &mut ctx.accounts.user_info;
    let now = Clock::get().unwrap().unix_timestamp;

    // get time and compare with start and end time
    if staking_info.start_time > now {
        msg!("current time: {}", now);
        msg!("start time: {}", staking_info.start_time);
        return Err(StakingError::StakingNotStarted.into());
    }

    // calculate pending reward
    let pending_reward = user_info.accumulated_reward(&staking_info);
    let staked_amount = user_info.staked_amount;

    // Update staking info
    staking_info.total_staked -= staked_amount;
    user_info.pending_reward = 0;
    user_info.last_claimed_reward_at = now;

    // Transfer token to staked user
    let unstake_amount = staked_amount + pending_reward;
    if unstake_amount > 0 {
        let cpi_accounts = TransferChecked {
            from: ctx.accounts.staking_vault.to_account_info().clone(),
            mint: ctx.accounts.mint_account.to_account_info().clone(),
            to: ctx
                .accounts
                .to_associated_token_account
                .to_account_info()
                .clone(),
            authority: ctx.accounts.staking_info.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let seeds = &[STAKING_SEED, &[bump]];
        let signer_seeds = &[&seeds[..]];
        let cpi_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        transfer_checked(
            cpi_context,
            unstake_amount,
            ctx.accounts.mint_account.decimals,
        )?;
    }

    msg!("Unstake all successfully.");

    Ok(())
}

pub fn claim_reward(ctx: Context<ClaimReward>, bump: u8) -> Result<()> {
    let staking_info = &mut ctx.accounts.staking_info;
    let user_info = &mut ctx.accounts.user_info;
    let now = Clock::get().unwrap().unix_timestamp;

    // get time and compare with start and end time
    if staking_info.start_time > now {
        msg!("current time: {}", now);
        msg!("start time: {}", staking_info.start_time);
        return Err(StakingError::StakingNotStarted.into());
    }

    // calculate pending reward
    let pending_reward = user_info.accumulated_reward(&staking_info);
    if pending_reward > 0 {
        // Transfer token to staked user
        let cpi_accounts = TransferChecked {
            from: ctx.accounts.staking_vault.to_account_info().clone(),
            mint: ctx.accounts.mint_account.to_account_info().clone(),
            to: ctx
                .accounts
                .to_associated_token_account
                .to_account_info()
                .clone(),
            authority: ctx.accounts.staking_info.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let seeds = &[STAKING_SEED, &[bump]];
        let signer_seeds = &[&seeds[..]];
        let cpi_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        transfer_checked(
            cpi_context,
            pending_reward,
            ctx.accounts.mint_account.decimals,
        )?;

        // Update reward info
        user_info.pending_reward = 0;
        user_info.last_claimed_reward_at = now;
    }

    msg!("Claim reward successfully.");

    Ok(())
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut)]
    pub mint_account: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint_account,
        associated_token::authority = staker,
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
        seeds = [USER_SEED, staker.key().as_ref()],
        bump
    )]
    pub user_info: Box<Account<'info, UserInfo>>,

    #[account(
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

#[derive(Accounts)]
pub struct UnstakeAll<'info> {
    #[account(mut)]
    pub mint_account: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint_account,
        associated_token::authority = staker,
        associated_token::token_program = token_program
    )]
    pub to_associated_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub staking_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [USER_SEED, staker.key().as_ref()],
        bump,
        close = staker
    )]
    pub user_info: Box<Account<'info, UserInfo>>,

    #[account(
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

#[derive(Accounts)]
pub struct ClaimReward<'info> {
    #[account(mut)]
    pub mint_account: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint_account,
        associated_token::authority = staker,
        associated_token::token_program = token_program
    )]
    pub to_associated_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub staking_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [USER_SEED, staker.key().as_ref()],
        bump
    )]
    pub user_info: Box<Account<'info, UserInfo>>,

    #[account(
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
