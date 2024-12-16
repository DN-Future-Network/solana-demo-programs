use anchor_lang::prelude::*;

#[error_code]
pub enum StakingError {
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
    #[msg("Not allowed")]
    NotAllowed,
    #[msg("Staking not started yet")]
    StakingNotStarted,
    #[msg("Staking already ended")]
    StakingEnded,
    #[msg("Amount must be greater than zero")]
    TokenAmountTooSmall,
    #[msg("Unstake amount cannot be greater than staked amount")]
    TokenAmountTooBig,
    #[msg("Stake amount reaches maximum amount")]
    ReachMaxStake,
    #[msg("Invalid Start time or End time")]
    InvalidStakingDateTimes,
}
