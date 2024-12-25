use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::spl_token_2022,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::constants::{PRESALE_SEED, PRESALE_VAULT};
use crate::errors::PresaleError;
use crate::state::PresaleInfo;

pub fn deposit_token(ctx: Context<DepositToken>, amount: u64) -> Result<()> {
    let presale_info = &mut ctx.accounts.presale_info;

    // transfer token to the presaleAta
    msg!(
        "Mint: {}",
        &ctx.accounts.mint_account.to_account_info().key()
    );
    msg!(
        "From Token Address: {}",
        &ctx.accounts.from_associated_token_account.key()
    );
    msg!(
        "To Token Address: {}",
        &ctx.accounts.to_associated_token_account.key()
    );

    let _ = spl_token_2022::onchain::invoke_transfer_checked(
        ctx.accounts.token_program.key,
        ctx.accounts
            .from_associated_token_account
            .to_account_info()
            .clone(),
        ctx.accounts.mint_account.to_account_info().clone(),
        ctx.accounts
            .to_associated_token_account
            .to_account_info()
            .clone(),
        ctx.accounts.authority.to_account_info(),
        &[],
        amount,
        ctx.accounts.mint_account.decimals,
        &[],
    );

    presale_info.deposit_token_amount = presale_info.deposit_token_amount + amount;

    msg!("Tokens deposited successfully.");

    Ok(())
}

#[derive(Accounts)]
pub struct DepositToken<'info> {
    #[account(mut)]
    pub mint_account: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint_account,
        associated_token::authority = authority,
        associated_token::token_program = token_program,
    )]
    pub from_associated_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init,
        payer = authority,
        associated_token::mint = mint_account,
        associated_token::authority = presale_info,
        associated_token::token_program = token_program,
    )]
    pub to_associated_token_account: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: This is not dangerous
    #[account(
        init_if_needed,
        payer = authority,
        seeds = [PRESALE_VAULT, presale_info.key().as_ref()],
        bump,
        space = 0
    )]
    pub presale_vault: AccountInfo<'info>,

    #[account(
        mut,
        has_one = authority @ PresaleError::Unauthorized,
        seeds = [PRESALE_SEED],
        bump
    )]
    pub presale_info: Box<Account<'info, PresaleInfo>>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
