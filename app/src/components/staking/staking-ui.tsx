import { PublicKey } from '@solana/web3.js'
import { useMemo, useState } from 'react'
import { useStakingProgram, useStakingProgramAccount } from './staking-data-access'
import { BN } from '@coral-xyz/anchor'
import { useGetTokenAccounts } from '../account/account-data-access'
import { Button } from '../ui/button'
import { InputNumber } from '../ui/input-number'

function Stake(props: Readonly<StakingProps>) {
  const { depositMutation } = useStakingProgramAccount({
    account: props.address,
  })

  return (
    <Button
      title="Stake Now!"
      disable={depositMutation.isPending}
      onClick={() => depositMutation.mutateAsync(new BN(123456))}
    />
  )
}

function UnStake(props: Readonly<StakingProps>) {
  const { unStakeMutation } = useStakingProgramAccount({
    account: props.address,
  })

  return <Button title="UnStake" disable={unStakeMutation.isPending} onClick={() => unStakeMutation.mutateAsync()} />
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
      <span className="text-3xl font-bold text-white">{value}</span>
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
      <PoolInfoItem
        title="START TIME"
        value={data ? new Date(data.startTime.toNumber() * 1000).toLocaleDateString() : ''}
      />
      <PoolInfoItem
        title="END TIME"
        value={data ? new Date(data.endTime.toNumber() * 1000).toLocaleDateString() : ''}
      />
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

function UserTokenBalance({ mint, address }: { mint: PublicKey | undefined; address: PublicKey }) {
  const query = useGetTokenAccounts({ address })
  const stakeToken = useMemo(
    () => query.data?.find((item) => mint && item.account.data.parsed.info.mint.toString() === mint.toString()),
    [query.data, mint],
  )

  return (
    <div className="flex justify-between items-center text-sm mb-2">
      <div>Your Token Balance</div>
      <span className="font-bold text-black">
        {stakeToken?.account.data.parsed.info.tokenAmount.uiAmountString} NPG
      </span>
    </div>
  )
}

function UserStakedBalance(props: Readonly<StakingProps>) {
  const { accountQuery } = useStakingProgramAccount({
    account: props.address,
  })
  const userInfo = useMemo(() => accountQuery.data ?? null, [accountQuery.data])

  return (
    <div className="flex justify-between items-center text-sm mb-2">
      <div>Your Token Staked</div>
      <span className="font-bold text-black">{new BN(userInfo?.stakedAmount).toString()} NPG</span>
    </div>
  )
}

function UserStakeInfo(props: Readonly<StakingProps>) {
  const { getStakingInfo } = useStakingProgram()
  const data = getStakingInfo.data

  return (
    <div>
      <UserTokenBalance mint={data?.tokenMintAddress} address={props.address} />
      <UserStakedBalance address={props.address} />
    </div>
  )
}

export function StakePanel(props: Readonly<StakingProps>) {
  const [activeStakeTab, setActiveStakeTab] = useState(true)

  return (
    <div className="bg-gradient-to-b from-stake-bg-from to-stake-bg-to p-8 pr-20 rounded-3xl h-full">
      <div className="flex flex-col text-left">
        <h2 className="left-1 text-3xl text-black mb-0">Single Stake</h2>
        <div className="flex flex-row text-black mt-1 mb-10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
            className="size-5 mr-1"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <p className="text-sm text-gray-300">Stake Your NPG Tokens</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6 pb-2 border-b border-b-gray-400">
        <button
          className={`bg-none text-2xl ${activeStakeTab ? 'text-black' : 'text-gray-300'}`}
          onClick={() => setActiveStakeTab(true)}
        >
          Stake
        </button>
        <button
          className={`bg-none text-2xl ${activeStakeTab ? 'text-gray-300' : 'text-black'}`}
          onClick={() => setActiveStakeTab(false)}
        >
          UnStake
        </button>
      </div>

      <InputNumber placeholder="Enter The Amount" />
      {activeStakeTab ? <Stake address={props.address} /> : <UnStake address={props.address} />}

      <UserStakeInfo address={props.address} />
    </div>
  )
}

interface StakingProps {
  address: PublicKey
}
