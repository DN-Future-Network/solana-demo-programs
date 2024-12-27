use anchor_lang::constant;

#[constant]
pub const LAMPORT_PER_SOL: u64 = 1_000_000_000;

#[constant]
pub const GAME_SEED: &[u8] = b"game";

#[constant]
pub const PLAYER_SEED: &[u8] = b"player";

#[constant]
pub const VAULT_SEED: &[u8] = b"vault";
