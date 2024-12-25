use anchor_lang::prelude::*;

use crate::constants::PRESALE_SEED;
use crate::errors::PresaleError;
use crate::state::PresaleInfo;

pub fn update_presale(
    ctx: Context<UpdatePresale>,
    max_token_amount_per_address: u64,
    price_per_token: u64,
    softcap_amount: u64,
    hardcap_amount: u64,
    start_time: u64,
    end_time: u64,
) -> Result<()> {
    let presale_info = &mut ctx.accounts.presale_info;
    presale_info.max_token_amount_per_address = max_token_amount_per_address;
    presale_info.price_per_token = price_per_token;
    presale_info.softcap_amount = softcap_amount;
    presale_info.hardcap_amount = hardcap_amount;
    presale_info.start_time = start_time;
    presale_info.end_time = end_time;

    Ok(())
}

#[derive(Accounts)]
pub struct UpdatePresale<'info> {
    #[account(
        mut,
        has_one = authority @ PresaleError::Unauthorized,
        seeds = [PRESALE_SEED],
        bump
    )]
    pub presale_info: Box<Account<'info, PresaleInfo>>,

    #[account(mut)]
    pub authority: Signer<'info>,
}
