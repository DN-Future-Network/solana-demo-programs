use anchor_lang::{prelude::*, system_program};

use crate::constants::{PRESALE_SEED, PRESALE_VAULT};
use crate::errors::PresaleError;
use crate::state::PresaleInfo;

pub fn withdraw_sol(ctx: Context<WithdrawSol>, amount: u64, bump: u8) -> Result<()> {
    msg!(
        "Vault: {:?} Send Amount {:?}",
        ctx.accounts.presale_vault.to_account_info().lamports(),
        amount
    );
    system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.presale_vault.to_account_info(),
                to: ctx.accounts.authority.to_account_info(),
            },
            &[&[PRESALE_VAULT, &[bump]][..]],
        ),
        amount,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawSol<'info> {
    #[account(
        has_one = authority @ PresaleError::Unauthorized,
        seeds = [PRESALE_SEED],
        bump
    )]
    pub presale_info: Box<Account<'info, PresaleInfo>>,

    /// CHECK: This is not dangerous
    #[account(
        mut,
        seeds = [PRESALE_VAULT, presale_info.key().as_ref()],
        bump,
    )]
    pub presale_vault: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}
