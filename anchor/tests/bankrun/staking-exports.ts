// Here we export some useful types and functions for interacting with the Anchor program.
import { Program } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import StakingIDL from '../../target/idl/staking.json'
import type { Staking } from '../../target/types/staking'
import { BankrunProvider } from 'anchor-bankrun'

// Re-export the generated IDL and type
export { Staking, StakingIDL }

// The programId is imported from the program IDL.
export const STAKING_PROGRAM_ID = new PublicKey(StakingIDL.address)

// This is a helper function to get the Staking Anchor program.
export function getStakingProgram(provider: BankrunProvider) {
  return new Program(StakingIDL as Staking, provider)
}
