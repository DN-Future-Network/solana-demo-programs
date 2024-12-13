use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};

use crate::constants::STAKING_SEED;
use crate::errors::StakingError;
use crate::state::StakingInfo;

pub fn deposit_reward(ctx: Context<DepositReward>, amount: u64) -> Result<()> {
    if amount == 0 {
        msg!("Stake amount: {}", amount);
        return Err(StakingError::TokenAmountTooSmall.into());
    }

    // Transfer token to staking vault
    let cpi_accounts = TransferChecked {
        from: ctx
            .accounts
            .from_associated_token_account
            .to_account_info()
            .clone(),
        mint: ctx.accounts.mint_account.to_account_info().clone(),
        to: ctx.accounts.staking_vault.to_account_info().clone(),
        authority: ctx.accounts.authority.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
    transfer_checked(cpi_context, amount, ctx.accounts.mint_account.decimals)?;
    msg!("Deposit rewards successfully.");

    Ok(())
}

#[derive(Accounts)]
pub struct DepositReward<'info> {
    #[account(mut)]
    pub mint_account: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint_account,
        associated_token::authority = authority,
        associated_token::token_program = token_program
    )]
    pub from_associated_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
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

    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
