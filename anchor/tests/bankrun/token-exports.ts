// Here we export some useful types and functions for interacting with the Anchor program.
import { Program } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import TokenIDL from '../../target/idl/token.json'
import type { Token } from '../../target/types/token'
import { BankrunProvider } from 'anchor-bankrun'

// Re-export the generated IDL and type
export { TokenIDL, Token }

// The programId is imported from the program IDL.
export const TOKEN_PROGRAM_ID = new PublicKey(TokenIDL.address)

// This is a helper function to get the Token Anchor program.
export function getTokenProgram(provider: BankrunProvider) {
  return new Program(TokenIDL as Token, provider)
}
