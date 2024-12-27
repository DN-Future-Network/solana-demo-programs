use anchor_lang::prelude::*;

#[error_code]
pub enum GameError {
    #[msg("Randomness Not Resolved")]
    RandomnessNotResolved,
    #[msg("Deposit failed")]
    DepositFailed,
    #[msg("Game already ended")]
    GameAlreadyEnded,
    #[msg("Not authority")]
    NotAuthority,
    #[msg("Game has not ended")]
    GameNotEnd,
    #[msg("You lost")]
    Lost,
}
