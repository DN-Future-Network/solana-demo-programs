use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("9G9s8fbeD7Q2kzS3tWeqbSDsEAkoERjThGqvcDgmVytG");

#[program]
pub mod staking {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        max_token_amount_per_address: u64,
        interest_rate: u16,
        start_time: i64,
        end_time: i64,
    ) -> Result<()> {
        return initialize::initialize(
            ctx,
            max_token_amount_per_address,
            interest_rate,
            start_time,
            end_time,
        );
    }

    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        return stake::stake(ctx, amount);
    }

    pub fn unstake(ctx: Context<Unstake>, bump: u8, amount: u64) -> Result<()> {
        return unstake::unstake(ctx, bump, amount);
    }

    pub fn claim_rewards(ctx: Context<ClaimRewards>, bump: u8) -> Result<()> {
        return unstake::claim_rewards(ctx, bump);
    }

    pub fn deposit_rewards(ctx: Context<DepositRewards>, amount: u64) -> Result<()> {
        return admin::deposit_rewards(ctx, amount);
    }

    pub fn emergency_withdraw(
        ctx: Context<EmergencyWithdraw>,
        bump: u8,
        amount: u64,
    ) -> Result<()> {
        return admin::emergency_withdraw(ctx, bump, amount);
    }

    pub fn toogle_pause(ctx: Context<TooglePause>) -> Result<()> {
        return admin::toogle_pause(ctx);
    }
}
