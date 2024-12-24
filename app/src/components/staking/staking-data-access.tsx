import { getStakingProgram, getStakingProgramId } from './program'
import { useConnection } from '@solana/wallet-adapter-react'
import { AnchorError, BN } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'
import { getAssociatedTokenAddressSync, getMint, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'

const STAKING_SEED = 'STAKING_SEED'
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

    return getAssociatedTokenAddressSync(
      getStakingInfo.data.tokenMintAddress,
      stakingInfoPDA,
      true, // Allow the owner account to be a PDA
      TOKEN_2022_PROGRAM_ID,
    )
  }, [getStakingInfo.data, stakingInfoPDA])

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
  const client = useQueryClient()
  const transactionToast = useTransactionToast()
  const { program, programId, getStakingInfo, stakingInfoBump, stakingInfoPDA, stakingToken } = useStakingProgram()
  const [userInfoPDA] = PublicKey.findProgramAddressSync([Buffer.from(USER_SEED), account.toBuffer()], programId)

  const isAdmin = useMemo(() => {
    if (!getStakingInfo.data) {
      return null
    }

    return getStakingInfo.data.authority.equals(account)
  }, [getStakingInfo.data, account])

  const accountQuery = useQuery({
    queryKey: ['staking', 'fetch-user', { cluster, account }],
    queryFn: () => program.account.userInfo.fetch(userInfoPDA),
  })

  // USER MUTATIONS
  const stakeMutation = useMutation({
    mutationKey: ['staking', 'stake', { cluster, account }],
    mutationFn: (amount: string) => {
      if (!getStakingInfo.data || !stakingToken) {
        throw new Error()
      }

      const tokenDecimals = stakingToken.data?.decimals
      if (!tokenDecimals) {
        throw new Error()
      }

      const bnAmount = new BN(Number(amount) * 10 ** tokenDecimals)
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
      return Promise.all([
        getStakingInfo.refetch(),
        accountQuery.refetch(),
        client.invalidateQueries({
          queryKey: ['get-token-balance', { endpoint: cluster.endpoint, address: account }],
        }),
      ])
    },
    onError: (error: AnchorError) => {
      toast.error(error?.error?.errorMessage ?? 'Failed to stake')
    },
  })

  const unStakeMutation = useMutation({
    mutationKey: ['staking', 'unstake', { cluster, account }],
    mutationFn: (amount: string) => {
      if (!getStakingInfo.data || !stakingToken) {
        throw new Error()
      }

      const tokenDecimals = stakingToken.data?.decimals
      if (!tokenDecimals) {
        throw new Error()
      }

      const bnAmount = new BN(Number(amount) * 10 ** tokenDecimals)
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
      return Promise.all([
        getStakingInfo.refetch(),
        accountQuery.refetch(),
        client.invalidateQueries({
          queryKey: ['get-token-balance', { endpoint: cluster.endpoint, address: account }],
        }),
      ])
    },
    onError: (error: AnchorError) => {
      toast.error(error?.error?.errorMessage ?? 'Failed to unstake')
    },
  })

  const claimRewardMutation = useMutation({
    mutationKey: ['staking', 'claim-reward', { cluster, account }],
    mutationFn: () => {
      if (!getStakingInfo.data) {
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
    onError: (error: AnchorError) => {
      toast.error(error?.error?.errorMessage ?? 'Failed to claim rewards')
    },
  })

  // ADMIN MUTATIONS
  const depositRewardsMutation = useMutation({
    mutationKey: ['staking', 'deposit-rewards', { cluster, account }],
    mutationFn: (amount: string) => {
      if (!getStakingInfo.data || !stakingToken) {
        throw new Error()
      }

      const tokenDecimals = stakingToken.data?.decimals
      if (!tokenDecimals) {
        throw new Error()
      }

      const bnAmount = new BN(Number(amount) * 10 ** tokenDecimals)
      return program.methods
        .depositRewards(bnAmount)
        .accounts({
          mintAccount: getStakingInfo.data.tokenMintAddress,
          // @ts-expect-error Anchor build error
          authority: account,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc()
    },
    onSuccess: (tx: string) => {
      transactionToast(tx)
      return Promise.all([
        getStakingInfo.refetch(),
        client.invalidateQueries({
          queryKey: ['get-token-balance', { endpoint: cluster.endpoint, address: account }],
        }),
        client.invalidateQueries({
          queryKey: ['get-token-balance', { endpoint: cluster.endpoint, address: stakingInfoPDA }],
        }),
      ])
    },
    onError: (error: AnchorError) => {
      toast.error(error?.error?.errorMessage ?? 'Failed to deposit rewards')
    },
  })

  const emergencyWithdrawMutation = useMutation({
    mutationKey: ['staking', 'emergency-withdraw', { cluster, account }],
    mutationFn: (amount: string) => {
      if (!getStakingInfo.data || !stakingToken) {
        throw new Error()
      }

      const tokenDecimals = stakingToken.data?.decimals
      if (!tokenDecimals) {
        throw new Error()
      }

      const bnAmount = new BN(Number(amount) * 10 ** tokenDecimals)
      return program.methods
        .emergencyWithdraw(stakingInfoBump, bnAmount)
        .accounts({
          mintAccount: getStakingInfo.data.tokenMintAddress,
          // @ts-expect-error Anchor build error
          authority: account,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc()
    },
    onSuccess: (tx: string) => {
      transactionToast(tx)
      return Promise.all([
        getStakingInfo.refetch(),
        client.invalidateQueries({
          queryKey: ['get-token-balance', { endpoint: cluster.endpoint, address: account }],
        }),
        client.invalidateQueries({
          queryKey: ['get-token-balance', { endpoint: cluster.endpoint, address: stakingInfoPDA }],
        }),
      ])
    },
    onError: (error: AnchorError) => {
      toast.error(error?.error?.errorMessage ?? 'Failed to withdraw rewards')
    },
  })

  const tooglePauseMutation = useMutation({
    mutationKey: ['staking', 'toogle-pause', { cluster, account }],
    mutationFn: () => {
      return program.methods
        .tooglePause()
        .accounts({
          authority: account,
        })
        .rpc()
    },
    onSuccess: (tx: string) => {
      transactionToast(tx)
      return Promise.all([getStakingInfo.refetch()])
    },
    onError: (error: AnchorError) => {
      toast.error(error?.error?.errorMessage ?? 'Failed to toogle pause staking pool')
    },
  })

  return {
    isAdmin,
    accountQuery,
    stakeMutation,
    unStakeMutation,
    claimRewardMutation,
    depositRewardsMutation,
    emergencyWithdrawMutation,
    tooglePauseMutation,
  }
}
