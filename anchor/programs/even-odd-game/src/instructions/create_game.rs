use anchor_lang::prelude::*;
use std::mem::size_of;

use crate::{Game, GameCounter, GAME_SEED};

pub fn create_game_handler(ctx: Context<CreateGame>) -> Result<()> {
    let counter = &mut ctx.accounts.game_counter_account;
    let game_id = counter.counter;

    let game = &mut ctx.accounts.game_account;
    game.game_id = game_id;
    game.creator = ctx.accounts.user.key();
    game.result = None;

    counter.counter += 1;

    Ok(())
}

#[derive(Accounts)]
pub struct CreateGame<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + size_of::<Game>(),
        seeds = [GAME_SEED, &game_counter_account.counter.to_le_bytes()[..]],
        bump
    )]
    pub game_account: Account<'info, Game>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account()]
    pub game_counter_account: Account<'info, GameCounter>,

    pub system_program: Program<'info, System>,
}
