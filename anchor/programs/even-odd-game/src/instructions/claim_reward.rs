use anchor_lang::prelude::*;
use anchor_lang::system_program;

use crate::{Game, GameError, Player, VAULT_SEED};

pub fn claim_reward_handler(ctx: Context<Claim>, bump: u8) -> Result<()> {
    let player_account = &ctx.accounts.player_account;
    let game_account = &mut ctx.accounts.game_account;
    msg!("Game account: {:?}", game_account);
    msg!("Player account: {:?}", player_account);
    let winner_player_count = if game_account.result.unwrap() {
        game_account.even_bet_count
    } else {
        game_account.player_count - game_account.even_bet_count
    };
    let reward_amount = game_account.reward / winner_player_count;
    msg!("Reward amount: {}", reward_amount);

    if reward_amount == 0 {
        return err!(GameError::Lost);
    }

    game_account.reward -= reward_amount;

    system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.vault_account.to_account_info(),
                to: ctx.accounts.user.to_account_info(),
            },
            &[&[VAULT_SEED, &[bump]][..]],
        ),
        reward_amount,
    )?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct Claim<'info> {
    #[account(
        mut,
        constraint = game_account.result.is_some() @ GameError::GameNotEnd,
    )]
    pub game_account: Account<'info, Game>,

    #[account(
        constraint = player_account.player == user.key() @ GameError::NotAuthority,
        constraint = game_account.result.unwrap() == player_account.bet @ GameError::Lost
    )]
    player_account: Account<'info, Player>,

    /// CHECK: This is safe
    #[account(
        mut,
        seeds = [VAULT_SEED],
        bump
    )]
    vault_account: AccountInfo<'info>,

    #[account(mut)]
    user: Signer<'info>,

    system_program: Program<'info, System>,
}
