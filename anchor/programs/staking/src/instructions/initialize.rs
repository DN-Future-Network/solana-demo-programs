use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::constants::STAKING_SEED;
use crate::errors::StakingError;
use crate::state::StakingInfo;

pub fn initialize(
    ctx: Context<Initialize>,
    max_token_amount_per_address: u64,
    interest_rate: u16,
    start_time: i64,
    end_time: i64,
) -> Result<()> {
    require!(
        max_token_amount_per_address > 0,
        StakingError::TokenAmountTooSmall
    );

    let now = Clock::get().unwrap().unix_timestamp;
    require!(
        start_time >= now && end_time > start_time,
        StakingError::InvalidStakingDateTimes
    );

    let staking_info = &mut ctx.accounts.staking_info;
    let authority = &ctx.accounts.admin;

    staking_info.token_mint_address = ctx.accounts.mint_account.to_account_info().key();
    staking_info.total_staked = 0;
    staking_info.start_time = start_time;
    staking_info.end_time = end_time;
    staking_info.max_token_amount_per_address = max_token_amount_per_address;
    staking_info.interest_rate = interest_rate;
    staking_info.is_paused = false;
    staking_info.authority = authority.key();

    msg!(
        "Staking pool has created for token: {}",
        staking_info.token_mint_address
    );

    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub mint_account: InterfaceAccount<'info, Mint>,

    #[account(
        init,
        payer = admin,
        associated_token::mint = mint_account,
        associated_token::authority = staking_info,
        associated_token::token_program = token_program
    )]
    pub staking_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init,
        seeds = [STAKING_SEED],
        bump,
        payer = admin,
        space = 8 + std::mem::size_of::<StakingInfo>(),
    )]
    pub staking_info: Box<Account<'info, StakingInfo>>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
