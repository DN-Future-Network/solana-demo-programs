use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct GameCounter {
    pub counter: u64,
}
