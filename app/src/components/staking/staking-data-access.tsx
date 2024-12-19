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
import { ASSOCIATED_TOKEN_PROGRAM_ID, getMint, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'

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

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const getStakingInfo = useQuery({
    queryKey: ['staking', 'fetch-info', { cluster }],
    queryFn: () => program.account.stakingInfo.fetch(stakingInfoPDA),
  })

  const stakingVaultATA = useMemo(() => {
    if (!getStakingInfo.data) {
      return null
    }

    return PublicKey.findProgramAddressSync(
      [Buffer.from(STAKING_VAULT), stakingInfoPDA.toBuffer(), getStakingInfo.data.tokenMintAddress.toBuffer()],
      programId,
    )[0]
  }, [getStakingInfo.data, stakingInfoPDA, programId])

  const stakingToken = useQuery({
    queryKey: ['staking', 'fetch-token', { cluster }],
    queryFn: () => {
      if (!getStakingInfo.data) {
        return null
      }

      return getMint(connection, getStakingInfo.data.tokenMintAddress, undefined, TOKEN_2022_PROGRAM_ID)
    },
  })

  return {
    program,
    programId,
    getStakingInfo,
    getProgramAccount,
    stakingInfoPDA,
    stakingInfoBump,
    stakingVaultATA,
    stakingToken,
  }
}

export function useStakingProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, programId, getStakingInfo, stakingInfoBump, stakingVaultATA, stakingToken } = useStakingProgram()
  const userTokenAccount = useMemo(() => {
    if (!getStakingInfo.data) {
      return null
    }

    return PublicKey.findProgramAddressSync(
      [account.toBytes(), TOKEN_2022_PROGRAM_ID.toBytes(), getStakingInfo.data.tokenMintAddress.toBytes()],
      ASSOCIATED_TOKEN_PROGRAM_ID,
    )[0]
  }, [account, getStakingInfo.data])

  const [userPDAAccount] = PublicKey.findProgramAddressSync([Buffer.from(USER_SEED), account.toBuffer()], programId)

  const accountQuery = useQuery({
    queryKey: ['staking', 'fetch-user', { cluster, account }],
    queryFn: () => program.account.userInfo.fetch(userPDAAccount),
  })

  const stakeMutation = useMutation({
    mutationKey: ['staking', 'deposit', { cluster, account }],
    mutationFn: (amount: string) => {
      if (!getStakingInfo.data || !stakingVaultATA || !userTokenAccount || !stakingToken) {
        throw new Error()
      }

      const tokenDecimals = stakingToken.data?.decimals
      if (!tokenDecimals) {
        throw new Error()
      }

      const bnAmount = new BN(amount).mul(new BN(10).pow(new BN(tokenDecimals)))
      return program.methods
        .stake(bnAmount)
        .accounts({
          mintAccount: getStakingInfo.data.tokenMintAddress,
          authority: account,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc()
    },
    onSuccess: (tx: string) => {
      transactionToast(tx)
      return Promise.all([getStakingInfo.refetch(), accountQuery.refetch()])
    },
    onError: () => toast.error('Failed to deposit'),
  })

  const unStakeMutation = useMutation({
    mutationKey: ['staking', 'unstake', { cluster, account }],
    mutationFn: (amount: string) => {
      if (!getStakingInfo.data || !stakingVaultATA || !userTokenAccount || !stakingToken) {
        throw new Error()
      }

      const tokenDecimals = stakingToken.data?.decimals
      if (!tokenDecimals) {
        throw new Error()
      }

      const bnAmount = new BN(amount).mul(new BN(10).pow(new BN(tokenDecimals)))
      return program.methods
        .unstake(stakingInfoBump, bnAmount)
        .accounts({
          mintAccount: getStakingInfo.data.tokenMintAddress,
          authority: account,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc()
    },
    onSuccess: (tx: string) => {
      transactionToast(tx)
      return Promise.all([getStakingInfo.refetch(), accountQuery.refetch()])
    },
    onError: () => toast.error('Failed to unstake'),
  })

  const claimRewardMutation = useMutation({
    mutationKey: ['staking', 'claim-reward', { cluster, account }],
    mutationFn: () => {
      if (!getStakingInfo.data || !stakingVaultATA || !userTokenAccount) {
        throw new Error()
      }

      return program.methods
        .claimRewards(stakingInfoBump)
        .accounts({
          mintAccount: getStakingInfo.data.tokenMintAddress,
          authority: account,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc()
    },
    onSuccess: (tx: string) => {
      transactionToast(tx)
      return Promise.all([getStakingInfo.refetch(), accountQuery.refetch()])
    },
    onError: () => toast.error('Failed to claim reward'),
  })

  return {
    accountQuery,
    stakeMutation,
    unStakeMutation,
    claimRewardMutation,
  }
}
