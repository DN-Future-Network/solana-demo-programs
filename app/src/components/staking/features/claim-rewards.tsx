import { PublicKey } from '@solana/web3.js'
import { useStakingProgram, useStakingProgramAccount } from '../staking-data-access'
import { Button } from '@/components/ui/custom'
import { amountToUiAmount } from '@/utils'
import { useMemo } from 'react'
import { IdlAccounts } from '@coral-xyz/anchor'
import { Staking } from '../program'
import { BN } from 'bn.js'

function calculateRewards(
  stakingInfo: IdlAccounts<Staking>['stakingInfo'] | undefined,
  userInfo: IdlAccounts<Staking>['userInfo'] | undefined,
  decimals = 6,
): number {
  if (!stakingInfo || !userInfo) {
    return 0
  }

  const minTime = Math.min(Math.floor(Date.now() / 1000), stakingInfo.endTime.toNumber())
  if (minTime <= userInfo.lastClaimedRewardAt.toNumber()) {
    return 0
  }

  const elapsedTime = minTime - userInfo.lastClaimedRewardAt.toNumber()
  const rewards = userInfo.stakedAmount
    .mul(new BN(elapsedTime))
    .mul(new BN(stakingInfo.interestRate))
    .div(new BN(3600 * 24 * 365 * 10000))

  return amountToUiAmount(userInfo.pendingReward.add(rewards), decimals)
}

export function ClaimRewards(props: Readonly<ClaimRewardProps>) {
  const { getStakingInfo, stakingToken } = useStakingProgram()

  const { accountQuery, claimRewardMutation } = useStakingProgramAccount({
    account: props.address,
  })

  const unclaimedRewards = useMemo(
    () => calculateRewards(getStakingInfo?.data, accountQuery?.data, stakingToken?.data?.decimals),
    [getStakingInfo.data, accountQuery.data, stakingToken.data],
  )

  return (
    <>
      <div className="flex justify-between items-center text-sm mb-2">
        <div className="text-gray-500">Unclaimed Rewards</div>
        <span className="font-bold text-white">{unclaimedRewards} NPG</span>
      </div>
      <Button
        title="Claim Now!"
        disable={claimRewardMutation.isPending}
        onClick={() => claimRewardMutation.mutateAsync()}
      />
    </>
  )
}

interface ClaimRewardProps {
  address: PublicKey
}
