import { getStakingProgram, getStakingProgramId } from './program'
import { useConnection } from '@solana/wallet-adapter-react'
import { BN } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'

import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'

const STAKING_SEED = 'STAKING_SEED'
const STAKING_VAULT = 'STAKING_VAULT'
const USER_SEED = 'USER_SEED'

export function useStakingProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getStakingProgramId(cluster.network as Cluster), [cluster])
  const program = getStakingProgram(provider)
  const [stakingInfoPDA, stakingInfoBump] = PublicKey.findProgramAddressSync([Buffer.from(STAKING_SEED)], programId)

  const mintAccount = 'CwpkwVT1992RexNANYYDj2japH9YSVJ4ToPSkFmHVezA' // import.meta.env.VITE_SOLANA_NETWORK
  const mint = new PublicKey(mintAccount)

  const [stakingVaultATA] = PublicKey.findProgramAddressSync(
    [Buffer.from(STAKING_VAULT), stakingInfoPDA.toBuffer(), mint.toBuffer()],
    programId,
  )

  const getStakingInfo = useQuery({
    queryKey: ['staking', 'fetch', { cluster }],
    queryFn: () => program.account.stakingInfo.fetch(stakingInfoPDA),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  // const createPool = useMutation({
  //   mutationKey: ['staking', 'create-pool', { cluster }],
  //   mutationFn: (keypair: Keypair) =>
  //     program.methods.createStakingPool(

  //     ).accounts({ staking: keypair.publicKey }).signers([keypair]).rpc(),
  //   onSuccess: (signature: string) => {
  //     transactionToast(signature)
  //     return accounts.refetch()
  //   },
  //   onError: () => toast.error('Failed to initialize account'),
  // })

  return {
    program,
    programId,
    getStakingInfo,
    getProgramAccount,
    stakingInfoPDA,
    stakingInfoBump,
    stakingVaultATA,
    mint,
  }
}

export function useStakingProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, programId, mint, stakingInfoPDA, stakingInfoBump, stakingVaultATA } = useStakingProgram()
  const [userTokenAccount] = PublicKey.findProgramAddressSync(
    [account.toBytes(), TOKEN_2022_PROGRAM_ID.toBytes(), mint.toBytes()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )
  const [userPDAAccount] = PublicKey.findProgramAddressSync([Buffer.from(USER_SEED), account.toBuffer()], programId)

  const accountQuery = useQuery({
    queryKey: ['staking', 'fetch-user', { cluster, account }],
    queryFn: () => program.account.userInfo.fetch(userPDAAccount),
  })

  const depositMutation = useMutation({
    mutationKey: ['staking', 'deposit', { cluster, account }],
    mutationFn: (amount: BN) => {
      const accountData = {
        mintAccount: mint,
        staker: account,
        fromAssociatedTokenAccount: userTokenAccount,
        stakingInfo: stakingInfoPDA,
        stakingVault: stakingVaultATA,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      }

      return program.methods.deposit(amount).accounts(accountData).rpc()
    },
    onSuccess: (tx: string) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
    onError: () => toast.error('Failed to deposit'),
  })

  const unStakeMutation = useMutation({
    mutationKey: ['staking', 'unstake', { cluster, account }],
    mutationFn: () => {
      const accountData = {
        mintAccount: mint,
        staker: account,
        toAssociatedTokenAccount: userTokenAccount,
        stakingInfo: stakingInfoPDA,
        stakingVault: stakingVaultATA,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      }

      return program.methods.withdraw(stakingInfoBump).accounts(accountData).rpc()
    },
    onSuccess: (tx: string) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
    onError: () => toast.error('Failed to unstake'),
  })

  const claimRewardMutation = useMutation({
    mutationKey: ['staking', 'claim-reward', { cluster, account }],
    mutationFn: () => {
      const accountData = {
        mintAccount: mint,
        staker: account,
        toAssociatedTokenAccount: userTokenAccount,
        stakingInfo: stakingInfoPDA,
        stakingVault: stakingVaultATA,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      }

      return program.methods.claimReward(stakingInfoBump).accounts(accountData).rpc()
    },
    onSuccess: (tx: string) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
    onError: () => toast.error('Failed to claim reward'),
  })

  return {
    accountQuery,
    depositMutation,
    unStakeMutation,
    claimRewardMutation,
  }
}
