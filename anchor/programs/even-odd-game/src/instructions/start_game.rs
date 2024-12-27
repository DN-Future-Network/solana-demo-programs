use anchor_lang::prelude::*;
// use switchboard_on_demand::accounts::RandomnessAccountData;

use crate::{Game, GameError};

fn xorshift64(seed: u64) -> u64 {
    let mut x = seed;
    x ^= x << 13;
    x ^= x >> 7;
    x ^= x << 17;
    x
}

pub fn start_game_handler(ctx: Context<StartGame>) -> Result<()> {
    let game_account = &mut ctx.accounts.game_account;
    msg!("Game account: {:?}", game_account);

    // let randomness_data =
    //     RandomnessAccountData::parse(ctx.accounts.randomness_account_data.data.borrow()).unwrap();
    // // call the switchboard on-demand get_value function to get the revealed random value
    // let clock: Clock = Clock::get()?;
    // let random_number = randomness_data
    //     .get_value(&clock)
    //     .map_err(|_| GameError::RandomnessNotResolved)?;

    // msg!("Random number: {}", random_number[0]);

    // Get current slot
    let slot = Clock::get()?.slot;
    // Generate pseudo-random number using XORShift with the current slot as seed
    let xorshift_output = xorshift64(slot);
    // Calculate random damage
    msg!("Random Damage: {}", xorshift_output);

    game_account.result = Some(xorshift_output % 2 == 0);

    Ok(())
}

#[derive(Accounts)]
pub struct StartGame<'info> {
    #[account(
        mut,
        constraint = game_account.creator == user.key() @ GameError::NotAuthority
    )]
    pub game_account: Account<'info, Game>,

    #[account(mut)]
    user: Signer<'info>,
    // pub randomness_account_data: AccountInfo<'info>,
}
