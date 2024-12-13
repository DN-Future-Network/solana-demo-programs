import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMint2Instruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token'
import { Commitment, Keypair, LAMPORTS_PER_SOL, PublicKey, Signer, SystemProgram, Transaction } from '@solana/web3.js'
import { BanksClient, Clock, ProgramTestContext } from 'solana-bankrun'
import BN from 'bn.js'

export async function createMint(
  banksClient: BanksClient,
  payer: Keypair,
  decimals: number,
  programId = TOKEN_PROGRAM_ID,
): Promise<PublicKey> {
  const mintKeypair = new Keypair()
  const rent = await banksClient.getRent()
  const rentExemptBalance = rent.minimumBalance(BigInt(MINT_SIZE))

  const transaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: MINT_SIZE,
      lamports: Number(rentExemptBalance),
      programId,
    }),
    createInitializeMint2Instruction(mintKeypair.publicKey, decimals, payer.publicKey, payer.publicKey, programId),
  )

  const blockhash = await banksClient.getLatestBlockhash()
  transaction.recentBlockhash = blockhash ? blockhash[0] : undefined
  transaction.feePayer = payer.publicKey
  transaction.sign(payer, mintKeypair)
  await banksClient.processTransaction(transaction)

  return mintKeypair.publicKey
}

export async function getOrCreateAssociatedTokenAccount(
  banksClient: BanksClient,
  payer: Signer,
  mint: PublicKey,
  owner: PublicKey,
  allowOwnerOffCurve = false,
  commitment?: Commitment,
  programId = TOKEN_PROGRAM_ID,
): Promise<PublicKey> {
  const associatedToken = getAssociatedTokenAddressSync(
    mint,
    owner,
    allowOwnerOffCurve,
    programId,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )

  const account = await banksClient.getAccount(associatedToken, commitment)
  if (!account) {
    const transaction = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        payer.publicKey,
        associatedToken,
        owner,
        mint,
        programId,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      ),
    )
    const blockhash = await banksClient.getLatestBlockhash()
    transaction.recentBlockhash = blockhash ? blockhash[0] : undefined
    transaction.feePayer = payer.publicKey
    transaction.sign(payer)
    await banksClient.processTransaction(transaction)
  }

  return associatedToken
}

export async function mintTo(
  banksClient: BanksClient,
  payer: Signer,
  mint: PublicKey,
  destination: PublicKey,
  authority: PublicKey,
  amount: BN,
  multiSigners: Signer[] = [],
  programId = TOKEN_PROGRAM_ID,
): Promise<void> {
  const transaction = new Transaction().add(
    createMintToInstruction(mint, destination, authority, BigInt(amount.toString()), multiSigners, programId),
  )
  const blockhash = await banksClient.getLatestBlockhash()
  transaction.recentBlockhash = blockhash ? blockhash[0] : undefined
  transaction.feePayer = payer.publicKey
  transaction.sign(payer)
  await banksClient.processTransaction(transaction)
}

export async function airdropSol(context: ProgramTestContext, address: PublicKey, amount: number): Promise<bigint> {
  const lamports = amount * LAMPORTS_PER_SOL

  const accountInfo = await context.banksClient.getAccount(address)

  const newBalance = BigInt(accountInfo ? accountInfo.lamports : 0) + BigInt(lamports)

  context.setAccount(address, {
    lamports: Number(newBalance),
    data: Buffer.alloc(0),
    owner: PublicKey.default,
    executable: false,
  })

  return newBalance
}

export async function setClock(context: ProgramTestContext, unixTimestamp: BN) {
  const currentClock = await context.banksClient.getClock()
  context.setClock(
    new Clock(
      currentClock.slot,
      currentClock.epochStartTimestamp,
      currentClock.epoch,
      currentClock.leaderScheduleEpoch,
      BigInt(unixTimestamp.toString()),
    ),
  )
}
