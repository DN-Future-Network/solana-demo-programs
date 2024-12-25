use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::spl_token_2022,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::constants::{PRESALE_SEED, USER_SEED};
use crate::errors::PresaleError;
use crate::state::{PresaleInfo, UserInfo};

pub fn claim_token(ctx: Context<ClaimToken>, bump: u8) -> Result<()> {
    let presale_info = &mut ctx.accounts.presale_info;

    let cur_timestamp = u64::try_from(Clock::get()?.unix_timestamp).unwrap();

    // get time and compare with start and end time
    if presale_info.end_time > cur_timestamp {
        msg!("current time: {}", cur_timestamp);
        msg!("presale end time: {}", presale_info.end_time);
        msg!("Presale not ended yet.");
        return Err(PresaleError::PresaleNotEnded.into());
    }

    let user_info = &mut ctx.accounts.user_info;
    let claim_amount = user_info.buy_token_amount;

    msg!(
        "Transferring presale tokens to buyer {}...",
        &ctx.accounts.buyer.key()
    );
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
        ctx.accounts.presale_info.to_account_info(),
        &[],
        claim_amount,
        ctx.accounts.mint_account.decimals,
        &[&[PRESALE_SEED, &[bump]][..]],
    );

    user_info.buy_token_amount = 0;
    user_info.claim_time = cur_timestamp;
    msg!("All claimed presale tokens transferred successfully.");

    Ok(())
}

#[derive(Accounts)]
pub struct ClaimToken<'info> {
    #[account(mut)]
    pub mint_account: InterfaceAccount<'info, Mint>,

    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = mint_account,
        associated_token::authority = buyer,
        associated_token::token_program = token_program
    )]
    pub to_associated_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint_account,
        associated_token::authority = presale_info,
        associated_token::token_program = token_program
    )]
    pub from_associated_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [USER_SEED],
        bump
    )]
    pub user_info: Box<Account<'info, UserInfo>>,

    #[account(
        seeds = [PRESALE_SEED],
        bump
    )]
    pub presale_info: Box<Account<'info, PresaleInfo>>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
