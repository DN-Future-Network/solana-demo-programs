use anchor_lang::prelude::*;

#[event]
pub struct GameEvent {
    pub amount: u64,
    pub player: Pubkey,
}
