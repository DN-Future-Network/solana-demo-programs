import { PublicKey } from '@solana/web3.js'
import { useMemo } from 'react'
import { useStakingProgram, useStakingProgramAccount } from './staking-data-access'
import { Button } from '../ui/button'
import moment from 'moment'

function toLocaleDateTimeString(timestamp: number): string {
  return moment(timestamp * 1000).format('DD/MM/YYYY hh:mm')
}

function ClaimReward(props: Readonly<StakingProps>) {
  const { claimRewardMutation } = useStakingProgramAccount({
    account: props.address,
  })

  const { accountQuery } = useStakingProgramAccount({
    account: props.address,
  })
  const userInfo = useMemo(() => accountQuery.data ?? null, [accountQuery.data])

  return (
    <>
      <div className="flex justify-between items-center text-sm mb-2">
        <div className="text-gray-500">Unclaimed Rewards</div>
        <span className="font-bold text-white">{userInfo ? userInfo.pendingReward.toString() : '0'} NPG</span>
      </div>
      <Button
        title="Claim Now!"
        disable={claimRewardMutation.isPending}
        onClick={() => claimRewardMutation.mutateAsync()}
      />
    </>
  )
}

function PoolInfoItem({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex justify-between items-center mb-6 pb-2 border-b-4 border-gray-500">
      <span className="text-xl font-bold text-white">{value}</span>
      <span className="text-base text-white">{title}</span>
    </div>
  )
}

function PoolInfo() {
  const { getStakingInfo } = useStakingProgram()
  const data = getStakingInfo.data

  return (
    <div className="mb-8">
      <h2 className="left-0 text-3xl text-white mb-8">Pool Information</h2>
      <PoolInfoItem title="APY" value={`${data ? data?.interestRate / 100 : 0}%`} />
      <PoolInfoItem title="TOTAL STAKED" value={`${data ? data?.totalStaked.toString() : 0} NPG`} />
      <PoolInfoItem title="LIMIT" value={`${data ? data?.maxTokenAmountPerAddress.toString() : 0} NPG`} />
      <PoolInfoItem title="START TIME" value={data ? toLocaleDateTimeString(data.startTime.toNumber()) : ''} />
      <PoolInfoItem title="END TIME" value={data ? toLocaleDateTimeString(data.endTime.toNumber()) : ''} />
    </div>
  )
}

export function RewardsPanel(props: Readonly<StakingProps>) {
  return (
    <div className="bg-reward p-8 rounded-3xl h-full -ml-10 flex flex-col justify-between">
      <PoolInfo />
      <ClaimReward address={props.address} />
    </div>
  )
}

interface StakingProps {
  address: PublicKey
}
