use anchor_lang::prelude::*;
use std::mem::size_of;

use crate::{GameCounter, Vault, GAME_SEED, VAULT_SEED};

pub fn initialize_handler(_ctx: Context<Initialize>) -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = user,
        seeds = [GAME_SEED],
        bump,
        space = 8 + size_of::<GameCounter>()
    )]
    pub game_counter_account: Account<'info, GameCounter>,

    #[account(
        init,
        payer = user,
        seeds = [VAULT_SEED],
        bump,
        space = 8 + size_of::<Vault>()
    )]
    pub vault_account: Account<'info, Vault>,

    #[account(mut)]
    user: Signer<'info>,

    system_program: Program<'info, System>,
}
