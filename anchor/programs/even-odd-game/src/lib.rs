use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod events;
pub mod instructions;
pub mod states;

pub use constants::*;
pub use errors::*;
pub use events::*;
pub use instructions::*;
pub use states::*;

declare_id!("AE4H2WjxmL8HKkefPffGbFYa5w97MgDVtnJG2UdCzX6x");

#[program]
pub mod even_odd_game {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        initialize_handler(ctx)
    }

    pub fn create_game(ctx: Context<CreateGame>) -> Result<()> {
        create_game_handler(ctx)
    }

    pub fn join_game(ctx: Context<JoinGame>, is_even_bet: bool, bet_amount: u64) -> Result<()> {
        join_game_handler(ctx, is_even_bet, bet_amount)
    }

    pub fn start_game(ctx: Context<StartGame>) -> Result<()> {
        start_game_handler(ctx)
    }

    pub fn claim_reward(ctx: Context<Claim>, bump: u8) -> Result<()> {
        claim_reward_handler(ctx, bump)
    }
}
