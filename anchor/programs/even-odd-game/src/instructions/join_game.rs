use anchor_lang::prelude::*;
use anchor_lang::system_program;
use std::mem::size_of;

use crate::{Game, GameError, Player, Vault, PLAYER_SEED, VAULT_SEED};

pub fn join_game_handler(ctx: Context<JoinGame>, bet: bool, bet_amount: u64) -> Result<()> {
    let player_account = &mut ctx.accounts.player_account;
    msg!("Player account: {:?}", player_account);
    player_account.bet_amount = bet_amount;
    player_account.bet = bet;
    player_account.player = ctx.accounts.user.key();

    let game_account = &mut ctx.accounts.game_account;
    msg!("Game account: {:?}", game_account);
    game_account.player_count += 1;
    game_account.reward += bet_amount;
    if bet {
        game_account.even_bet_count += 1;
    }

    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        system_program::Transfer {
            from: ctx.accounts.user.to_account_info(),
            to: ctx.accounts.vault_account.to_account_info(),
        },
    );

    let result = system_program::transfer(cpi_context, bet_amount);

    if result.is_err() {
        return err!(GameError::DepositFailed);
    }

    Ok(())
}

#[derive(Accounts)]
pub struct JoinGame<'info> {
    #[account(
        mut,
        constraint = game_account.result == None @ GameError::GameAlreadyEnded
    )]
    game_account: Account<'info, Game>,

    #[account(
        init,
        payer = user,
        seeds = [PLAYER_SEED, game_account.key().as_ref(), user.key().as_ref()],
        bump,
        space = 8 + size_of::<Player>()
    )]
    player_account: Account<'info, Player>,

    #[account(
        mut,
        seeds = [VAULT_SEED],
        bump
    )]
    vault_account: Account<'info, Vault>,

    #[account(mut)]
    user: Signer<'info>,

    system_program: Program<'info, System>,
}
