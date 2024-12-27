use anchor_lang::prelude::*;

#[account]
#[derive(Default, Debug)]
pub struct Game {
    pub game_id: u64,
    pub result: Option<bool>,
    pub creator: Pubkey,
    pub reward: u64,
    pub player_count: u64,
    pub even_bet_count: u64,
}
