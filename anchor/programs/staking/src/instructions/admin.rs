use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::spl_token_2022,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::constants::STAKING_SEED;
use crate::errors::StakingError;
use crate::state::StakingInfo;

pub fn deposit_rewards(ctx: Context<DepositRewards>, amount: u64) -> Result<()> {
    require!(amount > 0, StakingError::TokenAmountTooSmall);

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

    msg!("Deposit rewards successfully.");

    Ok(())
}

pub fn emergency_withdraw(ctx: Context<EmergencyWithdraw>, bump: u8, amount: u64) -> Result<()> {
    require!(amount > 0, StakingError::TokenAmountTooSmall);

    // Prevent from withdraw staked tokens
    let staking_info = &mut ctx.accounts.staking_info;
    require!(
        ctx.accounts.staking_vault.amount > staking_info.total_staked,
        StakingError::NotAllowed
    );

    let withdrawable = ctx.accounts.staking_vault.amount - staking_info.total_staked;
    require!(amount <= withdrawable, StakingError::NotAllowed);

    // Transfer tokens from staking vault to admin wallet
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
        amount,
        ctx.accounts.mint_account.decimals,
        &[&[STAKING_SEED, &[bump]][..]],
    );

    msg!("Withdraw rewards emergency successfully.");

    Ok(())
}

pub fn toogle_pause(ctx: Context<TooglePause>) -> Result<()> {
    let staking_info = &mut ctx.accounts.staking_info;
    staking_info.is_paused = !staking_info.is_paused;

    msg!("Toogle pause staking successfully.");

    Ok(())
}

#[derive(Accounts)]
pub struct DepositRewards<'info> {
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
        mut,
        has_one = authority @ StakingError::Unauthorized,
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
pub struct EmergencyWithdraw<'info> {
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
        has_one = authority @ StakingError::Unauthorized,
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
pub struct TooglePause<'info> {
    #[account(
        mut,
        has_one = authority @ StakingError::Unauthorized,
        seeds = [STAKING_SEED],
        bump
    )]
    pub staking_info: Box<Account<'info, StakingInfo>>,

    #[account(mut)]
    pub authority: Signer<'info>,
}
