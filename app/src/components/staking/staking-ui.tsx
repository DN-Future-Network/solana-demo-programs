import { PublicKey } from '@solana/web3.js'
import { useMemo, useState } from 'react'
import { useStakingProgram, useStakingProgramAccount } from './staking-data-access'
import { BN } from '@coral-xyz/anchor'
import { useGetTokenAccounts } from '../account/account-data-access'

function Stake(props: Readonly<StakingProps>) {
  const { depositMutation } = useStakingProgramAccount({
    account: props.address,
  })

  return (
    <button
      className="btn bg-black text-white w-full mb-6"
      onClick={() => depositMutation.mutateAsync(new BN(123456))}
      disabled={depositMutation.isPending}
    >
      Stake Now! {depositMutation.isPending && '...'}
    </button>
  )
}

function UnStake(props: Readonly<StakingProps>) {
  const { unStakeMutation } = useStakingProgramAccount({
    account: props.address,
  })

  return (
    <button
      className="btn btn-primary w-full mb-6"
      onClick={() => unStakeMutation.mutateAsync()}
      disabled={unStakeMutation.isPending}
    >
      UnStake {unStakeMutation.isPending && '...'}
    </button>
  )
}

function ClaimReward(props: Readonly<StakingProps>) {
  const { claimRewardMutation } = useStakingProgramAccount({
    account: props.address,
  })

  return (
    <button
      className="btn bg-black text-white w-full"
      onClick={() => claimRewardMutation.mutateAsync()}
      disabled={claimRewardMutation.isPending}
    >
      Claim Now! {claimRewardMutation.isPending && '...'}
    </button>
  )
}

function StakingPoolInfo() {
  const { getStakingInfo } = useStakingProgram()
  const data = getStakingInfo.data

  return (
    <div>
      <div
        className="flex justify-between items-center mb-6"
        style={{
          borderBottom: '1px solid',
        }}
      >
        <div className="text-2xl font-bold text-green-500">{data ? data?.interestRate / 100 : 0}%</div>
        <div>APY</div>
      </div>

      <div
        className="flex justify-between items-center mb-6"
        style={{
          borderBottom: '1px solid',
        }}
      >
        <div className="text-2xl font-bold text-green-500">
          {data ? new Date(data.startTime.toNumber() / 1000).toLocaleDateString() : ''}
        </div>
        <div>START TIME</div>
      </div>

      <div
        className="flex justify-between items-center mb-6"
        style={{
          borderBottom: '1px solid',
        }}
      >
        <div className="text-2xl font-bold text-green-500">
          {data ? new Date(data.endTime.toNumber() / 1000).toLocaleDateString() : ''}
        </div>
        <div>END TIME</div>
      </div>
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
    <div className="flex justify-between items-center mb-6">
      <div>Your Token Balance</div>
      <span className="font-bold text-black">{stakeToken?.account.data.parsed.info.tokenAmount.uiAmountString} NPG</span>
    </div>
  )
}

function UserStakedBalance(props: Readonly<StakingProps>) {
  const { accountQuery } = useStakingProgramAccount({
    account: props.address,
  })
  const userInfo = useMemo(() => accountQuery.data ?? null, [accountQuery.data])

  return (
    <div className="flex justify-between items-center mb-6">
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
      <h2 className="text-xl font-bold mb-4 text-black">Single Stake</h2>
      <p className="text-sm text-gray-300 mb-6">Stake Your NPG Tokens</p>

      <div
        className="flex justify-between items-center mb-6 border-bottom"
        style={{
          borderBottom: '1px solid',
        }}
      >
        <div
          onClick={() => setActiveStakeTab(true)}
          style={{ fontWeight: 'bold', color: activeStakeTab ? 'black' : 'white', cursor: 'pointer' }}
        >
          Stake
        </div>
        <div
          onClick={() => setActiveStakeTab(false)}
          style={{ fontWeight: 'bold', color: activeStakeTab ? 'white' : 'black', cursor: 'pointer' }}
        >
          UnStake
        </div>
      </div>

      <input type="number" placeholder="Enter The Amount" className="input input-bordered w-full mb-4 bg-transparent focus:outline-none" />
      {activeStakeTab ? <Stake address={props.address} /> : <UnStake address={props.address} />}

      <UserStakeInfo address={props.address} />
    </div>
  )
}

export function RewardsPanel(props: Readonly<StakingProps>) {
  const { accountQuery } = useStakingProgramAccount({
    account: props.address,
  })
  const userInfo = useMemo(() => accountQuery.data ?? null, [accountQuery.data])

  return (
    <div className="bg-reward p-8 rounded-3xl h-full -ml-10 flex flex-col justify-between">
      <h2 className="text-xl font-bold mb-4">Your Unclaimed Rewards</h2>
      <p className="text-2xl font-bold text-white mb-6">{new BN(userInfo?.pendingReward).toString()} NPG</p>

      <StakingPoolInfo />

      <ClaimReward address={props.address} />
    </div>
  )
}

interface StakingProps {
  address: PublicKey
}
