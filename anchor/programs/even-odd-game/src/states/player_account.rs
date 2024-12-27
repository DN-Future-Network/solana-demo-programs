use anchor_lang::prelude::*;

#[account]
#[derive(Default, Debug)]
pub struct Player {
    pub player: Pubkey,
    pub bet: bool,
    pub bet_amount: u64,
}
