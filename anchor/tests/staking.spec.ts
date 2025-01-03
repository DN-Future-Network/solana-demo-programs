import * as anchor from '@coral-xyz/anchor'
import { Program, BN } from '@coral-xyz/anchor'
import { TOKEN_2022_PROGRAM_ID, getAccount, getAssociatedTokenAddressSync } from '@solana/spl-token'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'

import { BanksClient, Clock, ProgramTestContext, startAnchor } from 'solana-bankrun'
import { BankrunProvider } from 'anchor-bankrun'
import { Staking } from '../target/types/staking'
import {
  getStakingProgram,
  STAKING_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  airdropSol,
  setClock,
} from './bankrun'

const TOKEN_DECIMALS = 6
const TOKEN_50 = new BN(50).mul(new BN(10 ** TOKEN_DECIMALS))
const TOKEN_100 = new BN(100).mul(new BN(10 ** TOKEN_DECIMALS))
const TOKEN_1000 = new BN(1000).mul(new BN(10 ** TOKEN_DECIMALS))

const STAKING_SEED = 'STAKING_SEED'
const USER_SEED = 'USER_SEED'

const STAKING_INTEREST_RATE = new BN(1000) // 10%
const STAKING_MAX_DEPOSIT_AMOUNT_PER_USER = TOKEN_1000

const DURATION_3_MONTHS = new BN(60 * 60 * 24 * 30 * 3)
const DURATION_6_MONTHS = DURATION_3_MONTHS.mul(new BN(2))
let STAKING_START_TIME: BN
let STAKING_END_TIME: BN

describe('staking', () => {
  let admin: Keypair
  let user1: Keypair

  let mint: PublicKey
  let ATA_user1: PublicKey
  let PDA_user1: PublicKey
  let ATA_admin: PublicKey

  let PDA_stakingInfo: PublicKey
  let PDA_stakingInfo_bump: number
  let ATA_stakingVault: PublicKey

  let programStaking: Program<Staking>

  let context: ProgramTestContext
  let banksClient: BanksClient
  let connection: Connection

  beforeEach(async () => {
    // Configure the client to use the local cluster.
    context = await startAnchor('', [{ name: 'staking', programId: STAKING_PROGRAM_ID }], [])
    banksClient = context.banksClient
    const provider = new BankrunProvider(context)
    anchor.setProvider(provider)
    connection = provider.connection
    programStaking = getStakingProgram(provider)

    const currentClock = await banksClient.getClock()
    STAKING_START_TIME = new BN(currentClock.unixTimestamp.toString())
    STAKING_END_TIME = STAKING_START_TIME.add(DURATION_6_MONTHS)

    admin = new Keypair()
    user1 = new Keypair()
    await airdropSol(context, admin.publicKey, 100)
    await airdropSol(context, user1.publicKey, 100)

    mint = await createMint(banksClient, admin, TOKEN_DECIMALS, TOKEN_2022_PROGRAM_ID)
    ATA_admin = await getOrCreateAssociatedTokenAccount(
      banksClient,
      admin,
      mint,
      admin.publicKey,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    )
    ATA_user1 = await getOrCreateAssociatedTokenAccount(
      banksClient,
      user1,
      mint,
      user1.publicKey,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    )

    // Mint tokens
    await mintTo(banksClient, admin, mint, ATA_admin, admin.publicKey, TOKEN_1000, [], TOKEN_2022_PROGRAM_ID)
    await mintTo(banksClient, admin, mint, ATA_user1, admin.publicKey, TOKEN_100, [], TOKEN_2022_PROGRAM_ID)

    // Get PDA accounts
    PDA_user1 = PublicKey.findProgramAddressSync(
      [Buffer.from(USER_SEED), user1.publicKey.toBuffer()],
      programStaking.programId,
    )[0]
    ;[PDA_stakingInfo, PDA_stakingInfo_bump] = PublicKey.findProgramAddressSync(
      [Buffer.from(STAKING_SEED)],
      programStaking.programId,
    )
    ATA_stakingVault = getAssociatedTokenAddressSync(
      mint,
      PDA_stakingInfo,
      true, // Allow the owner account to be a PDA
      TOKEN_2022_PROGRAM_ID,
    )
  })

  describe('initialize', () => {
    it('should failed when max token can stake is invalid', async () => {
      await expect(
        programStaking.methods
          .initialize(new BN(0), STAKING_INTEREST_RATE.toNumber(), STAKING_START_TIME, STAKING_END_TIME)
          .accounts({
            mintAccount: mint,
            admin: admin.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .signers([admin])
          .rpc(),
      ).rejects.toThrow('Amount must be greater than zero')
    })

    it('should failed when start time is less than current time', async () => {
      await expect(
        programStaking.methods
          .initialize(
            STAKING_MAX_DEPOSIT_AMOUNT_PER_USER,
            STAKING_INTEREST_RATE.toNumber(),
            STAKING_START_TIME.sub(new BN(1)),
            STAKING_END_TIME,
          )
          .accounts({
            mintAccount: mint,
            admin: admin.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .signers([admin])
          .rpc(),
      ).rejects.toThrow('Invalid Start time or End time')
    })

    it('should failed when start time equal end time', async () => {
      await expect(
        programStaking.methods
          .initialize(
            STAKING_MAX_DEPOSIT_AMOUNT_PER_USER,
            STAKING_INTEREST_RATE.toNumber(),
            STAKING_START_TIME,
            STAKING_START_TIME,
          )
          .accounts({
            mintAccount: mint,
            admin: admin.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .signers([admin])
          .rpc(),
      ).rejects.toThrow('Invalid Start time or End time')
    })

    it('should successfully', async () => {
      await programStaking.methods
        .initialize(
          STAKING_MAX_DEPOSIT_AMOUNT_PER_USER,
          STAKING_INTEREST_RATE.toNumber(),
          STAKING_START_TIME,
          STAKING_END_TIME,
        )
        .accounts({
          mintAccount: mint,
          admin: admin.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([admin])
        .rpc()

      const stakingInfo = await connection.getAccountInfo(PDA_stakingInfo)
      expect(stakingInfo?.owner.equals(programStaking.programId)).toBeTruthy()

      const stakingInfoData = await programStaking.account.stakingInfo.fetch(PDA_stakingInfo)
      expect(stakingInfoData.tokenMintAddress.equals(mint)).toBeTruthy()
      expect(stakingInfoData.isPaused).toBeFalsy()
      expect(stakingInfoData.authority.equals(admin.publicKey)).toBeTruthy()
      expect(stakingInfoData.totalStaked.isZero()).toBeTruthy()
      expect(stakingInfoData.maxTokenAmountPerAddress.eq(STAKING_MAX_DEPOSIT_AMOUNT_PER_USER)).toBeTruthy()
      expect(stakingInfoData.interestRate).toEqual(STAKING_INTEREST_RATE.toNumber())
      expect(stakingInfoData.startTime.eq(STAKING_START_TIME)).toBeTruthy()
      expect(stakingInfoData.endTime.eq(STAKING_END_TIME)).toBeTruthy()

      const stakingVault = await getAccount(connection, ATA_stakingVault, undefined, TOKEN_2022_PROGRAM_ID)
      expect(stakingVault.owner.equals(PDA_stakingInfo)).toBeTruthy()
    })
  })

  describe('stake', () => {
    beforeEach(async () => {
      await programStaking.methods
        .initialize(
          STAKING_MAX_DEPOSIT_AMOUNT_PER_USER,
          STAKING_INTEREST_RATE.toNumber(),
          STAKING_START_TIME,
          STAKING_END_TIME,
        )
        .accounts({
          mintAccount: mint,
          admin: admin.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([admin])
        .rpc()
    })

    it('should failed when staking has paused', async () => {
      await programStaking.methods
        .tooglePause()
        .accounts({
          authority: admin.publicKey,
        })
        .signers([admin])
        .rpc()

      await expect(
        programStaking.methods
          .stake(TOKEN_100)
          .accounts({
            mintAccount: mint,
            authority: user1.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .signers([user1])
          .rpc(),
      ).rejects.toThrow('Staking temporarily paused')
    })

    it('should failed when staking has not started yet', async () => {
      await setClock(context, STAKING_START_TIME.sub(new BN(1)))
      await expect(
        programStaking.methods
          .stake(TOKEN_100)
          .accounts({
            mintAccount: mint,
            authority: user1.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .signers([user1])
          .rpc(),
      ).rejects.toThrow('Staking not started yet')
    })

    it('should failed when staking has ended', async () => {
      await setClock(context, STAKING_END_TIME.add(new BN(1)))

      await expect(
        programStaking.methods
          .stake(TOKEN_100)
          .accounts({
            mintAccount: mint,
            authority: user1.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .signers([user1])
          .rpc(),
      ).rejects.toThrow('Staking already ended')
    })

    it('should failed when stake amount is zero', async () => {
      await expect(
        programStaking.methods
          .stake(new BN(0))
          .accounts({
            mintAccount: mint,
            authority: user1.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .signers([user1])
          .rpc(),
      ).rejects.toThrow('Amount must be greater than zero')
    })

    it('should failed when stake exceeds limit token per address', async () => {
      await expect(
        programStaking.methods
          .stake(STAKING_MAX_DEPOSIT_AMOUNT_PER_USER.add(new BN(1)))
          .accounts({
            mintAccount: mint,
            authority: user1.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .signers([user1])
          .rpc(),
      ).rejects.toThrow('Stake amount reaches maximum amount')
    })

    it('should successfully', async () => {
      const ATA_user1_before = await getAccount(connection, ATA_user1, undefined, TOKEN_2022_PROGRAM_ID)
      const ATA_stakingVault_before = await getAccount(connection, ATA_stakingVault, undefined, TOKEN_2022_PROGRAM_ID)

      // Set current time to start time
      const currentClock = await banksClient.getClock()
      context.setClock(
        new Clock(
          currentClock.slot,
          currentClock.epochStartTimestamp,
          currentClock.epoch,
          currentClock.leaderScheduleEpoch,
          BigInt(STAKING_START_TIME.toString()),
        ),
      )
      await programStaking.methods
        .stake(TOKEN_100)
        .accounts({
          mintAccount: mint,
          authority: user1.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([user1])
        .rpc()

      const ATA_user1_after = await getAccount(connection, ATA_user1, undefined, TOKEN_2022_PROGRAM_ID)
      const ATA_stakingVault_after = await getAccount(connection, ATA_stakingVault, undefined, TOKEN_2022_PROGRAM_ID)

      expect((ATA_user1_before.amount - ATA_user1_after.amount).toString()).toEqual(TOKEN_100.toString())
      expect((ATA_stakingVault_after.amount - ATA_stakingVault_before.amount).toString()).toEqual(TOKEN_100.toString())

      const userInfo = await connection.getAccountInfo(PDA_user1)
      expect(userInfo?.owner.equals(programStaking.programId)).toBeTruthy()

      const userInfoData = await programStaking.account.userInfo.fetch(PDA_user1)
      expect(userInfoData.authority.equals(user1.publicKey)).toBeTruthy()
      expect(userInfoData.stakedAmount.eq(TOKEN_100)).toBeTruthy()
      expect(userInfoData.pendingReward.isZero()).toBeTruthy()
      expect(userInfoData.lastClaimedRewardAt.gte(STAKING_START_TIME)).toBeTruthy()

      const stakingInfoData = await programStaking.account.stakingInfo.fetch(PDA_stakingInfo)
      expect(stakingInfoData.totalStaked.eq(TOKEN_100)).toBeTruthy()
    })
  })

  describe('unstake', () => {
    beforeEach(async () => {
      await programStaking.methods
        .initialize(
          STAKING_MAX_DEPOSIT_AMOUNT_PER_USER,
          STAKING_INTEREST_RATE.toNumber(),
          STAKING_START_TIME,
          STAKING_END_TIME,
        )
        .accounts({
          mintAccount: mint,
          admin: admin.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([admin])
        .rpc()

      // User stake tokens
      await programStaking.methods
        .stake(TOKEN_100)
        .accounts({
          mintAccount: mint,
          authority: user1.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([user1])
        .rpc()

      // Admin deposit token for rewards
      await programStaking.methods
        .depositRewards(TOKEN_1000)
        .accounts({
          mintAccount: mint,
          /* @ts-ignore */
          authority: admin.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([admin])
        .rpc()
    })

    it('should failed when staking has paused', async () => {
      await programStaking.methods
        .tooglePause()
        .accounts({
          authority: admin.publicKey,
        })
        .signers([admin])
        .rpc()

      await expect(
        programStaking.methods
          .unstake(PDA_stakingInfo_bump, TOKEN_50)
          .accounts({
            mintAccount: mint,
            authority: user1.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .signers([user1])
          .rpc(),
      ).rejects.toThrow('Staking temporarily paused')
    })

    it('should failed when unstake with zero amount', async () => {
      await expect(
        programStaking.methods
          .unstake(PDA_stakingInfo_bump, new BN(0))
          .accounts({
            mintAccount: mint,
            authority: user1.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .signers([user1])
          .rpc(),
      ).rejects.toThrow('Amount must be greater than zero')
    })

    it('should failed when unstake greater than staked amount', async () => {
      await expect(
        programStaking.methods
          .unstake(PDA_stakingInfo_bump, TOKEN_100.add(new BN(1)))
          .accounts({
            mintAccount: mint,
            authority: user1.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .signers([user1])
          .rpc(),
      ).rejects.toThrow('Amount cannot be greater than staked amount')
    })

    it('Should successfully', async () => {
      const ATA_user1_before = await getAccount(connection, ATA_user1, undefined, TOKEN_2022_PROGRAM_ID)
      const ATA_stakingVault_before = await getAccount(connection, ATA_stakingVault, undefined, TOKEN_2022_PROGRAM_ID)

      let userInfo = await programStaking.account.userInfo.fetch(PDA_user1)
      let stakingInfo = await programStaking.account.stakingInfo.fetch(PDA_stakingInfo)
      const expectedRewards = calculateRewards(stakingInfo, userInfo, DURATION_3_MONTHS)

      // Move timestamp 3 months
      await setClock(context, STAKING_START_TIME.add(DURATION_3_MONTHS))

      // Unstake a part of staked tokens after 3 months
      await programStaking.methods
        .unstake(PDA_stakingInfo_bump, TOKEN_50)
        .accounts({
          mintAccount: mint,
          authority: user1.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([user1])
        .rpc()

      const ATA_user1_after = await getAccount(connection, ATA_user1, undefined, TOKEN_2022_PROGRAM_ID)
      const ATA_stakingVault_after = await getAccount(connection, ATA_stakingVault, undefined, TOKEN_2022_PROGRAM_ID)

      expect((ATA_user1_after.amount - ATA_user1_before.amount).toString()).toEqual(
        expectedRewards.add(TOKEN_50).toString(),
      )
      expect((ATA_stakingVault_before.amount - ATA_stakingVault_after.amount).toString()).toEqual(
        expectedRewards.add(TOKEN_50).toString(),
      )

      stakingInfo = await programStaking.account.stakingInfo.fetch(PDA_stakingInfo)
      expect(stakingInfo.totalStaked.eq(TOKEN_50)).toBeTruthy()

      userInfo = await programStaking.account.userInfo.fetch(PDA_user1)
      expect(userInfo.stakedAmount.eq(TOKEN_50)).toBeTruthy()
      expect(userInfo.pendingReward.isZero()).toBeTruthy()
      expect(userInfo.lastClaimedRewardAt.eq(STAKING_START_TIME.add(DURATION_3_MONTHS))).toBeTruthy()

      // Unstake all remain tokens and close stake position after 3 months
      await setClock(context, STAKING_START_TIME.add(DURATION_3_MONTHS))
      await programStaking.methods
        .unstake(PDA_stakingInfo_bump, TOKEN_50)
        .accounts({
          mintAccount: mint,
          authority: user1.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([user1])
        .rpc()

      stakingInfo = await programStaking.account.stakingInfo.fetch(PDA_stakingInfo)
      expect(stakingInfo.totalStaked.isZero()).toBeTruthy()

      await expect(programStaking.account.userInfo.fetch(PDA_user1)).rejects.toThrow(`Could not find ${PDA_user1}`)
    })
  })

  describe('claimRewards', () => {
    beforeEach(async () => {
      await programStaking.methods
        .initialize(
          STAKING_MAX_DEPOSIT_AMOUNT_PER_USER,
          STAKING_INTEREST_RATE.toNumber(),
          STAKING_START_TIME,
          STAKING_END_TIME,
        )
        .accounts({
          mintAccount: mint,
          admin: admin.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([admin])
        .rpc()

      // User stake tokens
      await programStaking.methods
        .stake(TOKEN_100)
        .accounts({
          mintAccount: mint,
          authority: user1.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([user1])
        .rpc()

      // Admin deposit token for rewards
      await programStaking.methods
        .depositRewards(TOKEN_1000)
        .accounts({
          mintAccount: mint,
          /* @ts-ignore */
          authority: admin.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([admin])
        .rpc()
    })

    it('should failed when staking has paused', async () => {
      await programStaking.methods
        .tooglePause()
        .accounts({
          authority: admin.publicKey,
        })
        .signers([admin])
        .rpc()

      await expect(
        programStaking.methods
          .claimRewards(PDA_stakingInfo_bump)
          .accounts({
            mintAccount: mint,
            authority: user1.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .signers([user1])
          .rpc(),
      ).rejects.toThrow('Staking temporarily paused')
    })

    it('should failed when staking has not started yet', async () => {
      await setClock(context, STAKING_START_TIME.sub(new BN(1)))
      await expect(
        programStaking.methods
          .claimRewards(PDA_stakingInfo_bump)
          .accounts({
            mintAccount: mint,
            authority: user1.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .signers([user1])
          .rpc(),
      ).rejects.toThrow('Staking not started yet')
    })

    it('Should successfully', async () => {
      const ATA_user1_before = await getAccount(connection, ATA_user1, undefined, TOKEN_2022_PROGRAM_ID)
      const ATA_stakingVault_before = await getAccount(connection, ATA_stakingVault, undefined, TOKEN_2022_PROGRAM_ID)

      let userInfo = await programStaking.account.userInfo.fetch(PDA_user1)
      let stakingInfo = await programStaking.account.stakingInfo.fetch(PDA_stakingInfo)
      const expectedRewards = calculateRewards(stakingInfo, userInfo, DURATION_3_MONTHS)

      // Move timestamp 3 months
      await setClock(context, STAKING_START_TIME.add(DURATION_3_MONTHS))
      await programStaking.methods
        .claimRewards(PDA_stakingInfo_bump)
        .accounts({
          mintAccount: mint,
          authority: user1.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([user1])
        .rpc()

      let ATA_user1_after = await getAccount(connection, ATA_user1, undefined, TOKEN_2022_PROGRAM_ID)
      let ATA_stakingVault_after = await getAccount(connection, ATA_stakingVault, undefined, TOKEN_2022_PROGRAM_ID)

      expect((ATA_user1_after.amount - ATA_user1_before.amount).toString()).toEqual(expectedRewards.toString())
      expect((ATA_stakingVault_before.amount - ATA_stakingVault_after.amount).toString()).toEqual(
        expectedRewards.toString(),
      )

      stakingInfo = await programStaking.account.stakingInfo.fetch(PDA_stakingInfo)
      expect(stakingInfo.totalStaked.eq(TOKEN_100)).toBeTruthy()

      userInfo = await programStaking.account.userInfo.fetch(PDA_user1)
      expect(userInfo.stakedAmount.eq(TOKEN_100)).toBeTruthy()
      expect(userInfo.pendingReward.isZero()).toBeTruthy()
      expect(userInfo.lastClaimedRewardAt.eq(STAKING_START_TIME.add(DURATION_3_MONTHS))).toBeTruthy()

      // Unstake all remain tokens and close stake position after 3 months
      await setClock(context, STAKING_START_TIME.add(DURATION_6_MONTHS.add(new BN(1))))
      await programStaking.methods
        .claimRewards(PDA_stakingInfo_bump)
        .accounts({
          mintAccount: mint,
          authority: user1.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([user1])
        .rpc()

      ATA_user1_after = await getAccount(connection, ATA_user1, undefined, TOKEN_2022_PROGRAM_ID)
      ATA_stakingVault_after = await getAccount(connection, ATA_stakingVault, undefined, TOKEN_2022_PROGRAM_ID)
      expect(ATA_user1_after.amount.toString()).toEqual(expectedRewards.mul(new BN(2)).toString())
      expect(ATA_stakingVault_after.amount.toString()).toEqual(
        TOKEN_1000.add(TOKEN_100).sub(new BN(ATA_user1_after.amount.toString())).toString(),
      )

      stakingInfo = await programStaking.account.stakingInfo.fetch(PDA_stakingInfo)
      expect(stakingInfo.totalStaked.eq(TOKEN_100)).toBeTruthy()

      userInfo = await programStaking.account.userInfo.fetch(PDA_user1)
      expect(userInfo.stakedAmount.eq(TOKEN_100)).toBeTruthy()
      expect(userInfo.pendingReward.isZero()).toBeTruthy()
      expect(userInfo.lastClaimedRewardAt.eq(STAKING_START_TIME.add(DURATION_6_MONTHS).add(new BN(1)))).toBeTruthy()
    })
  })

  describe('admin', () => {
    beforeEach(async () => {
      await programStaking.methods
        .initialize(
          STAKING_MAX_DEPOSIT_AMOUNT_PER_USER,
          STAKING_INTEREST_RATE.toNumber(),
          STAKING_START_TIME,
          STAKING_END_TIME,
        )
        .accounts({
          mintAccount: mint,
          admin: admin.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([admin])
        .rpc()
    })

    describe('depositRewards', () => {
      it('Should failed when signer is not admin', async () => {
        await expect(
          programStaking.methods
            .depositRewards(TOKEN_1000)
            .accounts({
              mintAccount: mint,
              /* @ts-ignore */
              authority: user1.publicKey,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
            })
            .signers([user1])
            .rpc(),
        ).rejects.toThrow('You are not authorized to perform this action')
      })

      it('Should failed when amount is zero', async () => {
        await expect(
          programStaking.methods
            .depositRewards(new BN(0))
            .accounts({
              mintAccount: mint,
              /* @ts-ignore */
              authority: admin.publicKey,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
            })
            .signers([admin])
            .rpc(),
        ).rejects.toThrow('Amount must be greater than zero')
      })

      it('Should successfully', async () => {
        const ATA_admin_before = await getAccount(connection, ATA_admin, undefined, TOKEN_2022_PROGRAM_ID)
        const ATA_stakingVault_before = await getAccount(connection, ATA_stakingVault, undefined, TOKEN_2022_PROGRAM_ID)

        await programStaking.methods
          .depositRewards(TOKEN_1000)
          .accounts({
            mintAccount: mint,
            /* @ts-ignore */
            authority: admin.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .signers([admin])
          .rpc()

        const ATA_admin_after = await getAccount(connection, ATA_admin, undefined, TOKEN_2022_PROGRAM_ID)
        const ATA_stakingVault_after = await getAccount(connection, ATA_stakingVault, undefined, TOKEN_2022_PROGRAM_ID)

        expect((ATA_admin_before.amount - ATA_admin_after.amount).toString()).toEqual(TOKEN_1000.toString())
        expect((ATA_stakingVault_after.amount - ATA_stakingVault_before.amount).toString()).toEqual(
          TOKEN_1000.toString(),
        )
      })
    })

    describe('emergencyWithdraw', () => {
      beforeEach(async () => {
        // User stake tokens
        await programStaking.methods
          .stake(TOKEN_100)
          .accounts({
            mintAccount: mint,
            authority: user1.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .signers([user1])
          .rpc()
      })

      it('Should failed when signer is not admin', async () => {
        await expect(
          programStaking.methods
            .emergencyWithdraw(PDA_stakingInfo_bump, TOKEN_1000)
            .accounts({
              mintAccount: mint,
              /* @ts-ignore */
              authority: user1.publicKey,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
            })
            .signers([user1])
            .rpc(),
        ).rejects.toThrow('You are not authorized to perform this action')
      })

      it('Should failed when amount is zero', async () => {
        await expect(
          programStaking.methods
            .emergencyWithdraw(PDA_stakingInfo_bump, new BN(0))
            .accounts({
              mintAccount: mint,
              /* @ts-ignore */
              authority: admin.publicKey,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
            })
            .signers([admin])
            .rpc(),
        ).rejects.toThrow('Amount must be greater than zero')
      })

      it('Should failed when vault balance <= total staked', async () => {
        await expect(
          programStaking.methods
            .emergencyWithdraw(PDA_stakingInfo_bump, new BN(1))
            .accounts({
              mintAccount: mint,
              /* @ts-ignore */
              authority: admin.publicKey,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
            })
            .signers([admin])
            .rpc(),
        ).rejects.toThrow('Not allowed')
      })

      it('Should failed when amount > witdrawable', async () => {
        await programStaking.methods
          .depositRewards(TOKEN_100)
          .accounts({
            mintAccount: mint,
            /* @ts-ignore */
            authority: admin.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .signers([admin])
          .rpc()

        await expect(
          programStaking.methods
            .emergencyWithdraw(PDA_stakingInfo_bump, TOKEN_100.add(new BN(1)))
            .accounts({
              mintAccount: mint,
              /* @ts-ignore */
              authority: admin.publicKey,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
            })
            .signers([admin])
            .rpc(),
        ).rejects.toThrow('Not allowed')
      })

      it('Should successfully', async () => {
        await programStaking.methods
          .depositRewards(TOKEN_1000)
          .accounts({
            mintAccount: mint,
            /* @ts-ignore */
            authority: admin.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .signers([admin])
          .rpc()

        const ATA_admin_before = await getAccount(connection, ATA_admin, undefined, TOKEN_2022_PROGRAM_ID)
        const ATA_stakingVault_before = await getAccount(connection, ATA_stakingVault, undefined, TOKEN_2022_PROGRAM_ID)

        await programStaking.methods
          .emergencyWithdraw(PDA_stakingInfo_bump, TOKEN_1000)
          .accounts({
            mintAccount: mint,
            /* @ts-ignore */
            authority: admin.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .signers([admin])
          .rpc()

        const ATA_admin_after = await getAccount(connection, ATA_admin, undefined, TOKEN_2022_PROGRAM_ID)
        const ATA_stakingVault_after = await getAccount(connection, ATA_stakingVault, undefined, TOKEN_2022_PROGRAM_ID)

        expect((ATA_admin_after.amount - ATA_admin_before.amount).toString()).toEqual(TOKEN_1000.toString())
        expect((ATA_stakingVault_before.amount - ATA_stakingVault_after.amount).toString()).toEqual(
          TOKEN_1000.toString(),
        )
      })
    })

    describe('toogle_pause', () => {
      it('Should failed when signer is not admin', async () => {
        await expect(
          programStaking.methods
            .tooglePause()
            .accounts({
              authority: user1.publicKey,
            })
            .signers([user1])
            .rpc(),
        ).rejects.toThrow('You are not authorized to perform this action')
      })

      it('Should successfully', async () => {
        let stakingInfo = await programStaking.account.stakingInfo.fetch(PDA_stakingInfo)
        expect(stakingInfo.isPaused).toBeFalsy()

        await programStaking.methods
          .tooglePause()
          .accounts({
            authority: admin.publicKey,
          })
          .signers([admin])
          .rpc()

        stakingInfo = await programStaking.account.stakingInfo.fetch(PDA_stakingInfo)
        expect(stakingInfo.isPaused).toBeTruthy()

        await programStaking.methods
          .tooglePause()
          .accounts({
            authority: admin.publicKey,
          })
          .signers([admin])
          .rpc()

        stakingInfo = await programStaking.account.stakingInfo.fetch(PDA_stakingInfo)
        expect(stakingInfo.isPaused).toBeFalsy()
      })
    })
  })
})

function calculateRewards(
  stakingInfo: anchor.IdlAccounts<Staking>['stakingInfo'],
  userInfo: anchor.IdlAccounts<Staking>['userInfo'],
  elapsedTime: BN,
): BN {
  const rewards = userInfo.stakedAmount
    .mul(elapsedTime)
    .mul(new BN(stakingInfo.interestRate))
    .div(new BN(3600 * 24 * 365 * 10000))

  return userInfo.pendingReward.add(rewards)
}
