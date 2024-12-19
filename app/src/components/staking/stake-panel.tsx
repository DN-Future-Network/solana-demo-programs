import { PublicKey } from '@solana/web3.js'
import { useEffect, useMemo, useState } from 'react'
import { useStakingProgram, useStakingProgramAccount } from './staking-data-access'
import { BN } from '@coral-xyz/anchor'
import { useGetTokenAccounts } from '../account/account-data-access'
import { Button } from '../ui/button'
import { InputNumber } from '../ui/input-number'
import { Range } from '../ui/range'

function Stake(props: Readonly<StakingActionProps>) {
  const { stakeMutation } = useStakingProgramAccount({
    account: props.address,
  })

  return (
    <Button
      title="Stake Now!"
      disable={stakeMutation.isPending}
      onClick={() => stakeMutation.mutateAsync(props.amount)}
    />
  )
}

function UnStake(props: Readonly<StakingActionProps>) {
  const { unStakeMutation } = useStakingProgramAccount({
    account: props.address,
  })

  return (
    <Button
      title="UnStake"
      disable={unStakeMutation.isPending}
      onClick={() => unStakeMutation.mutateAsync(props.amount)}
    />
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
      <span className="font-bold text-black">{new BN(userInfo?.stakedAmount || 0).toString()} NPG</span>
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
  const [maxTokenBalance, setMaxTokenBalance] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [rangeValue, setRangeValue] = useState(0)

  const { getStakingInfo, stakingToken } = useStakingProgram()
  const data = getStakingInfo.data
  const query = useGetTokenAccounts({ address: props.address })
  const token = useMemo(
    () =>
      query.data?.find(
        (item) =>
          data?.tokenMintAddress && item.account.data.parsed.info.mint.toString() === data.tokenMintAddress.toString(),
      ),
    [query.data, data?.tokenMintAddress],
  )

  const { accountQuery } = useStakingProgramAccount({
    account: props.address,
  })
  const userInfo = useMemo(() => accountQuery.data ?? null, [accountQuery.data])

  useEffect(() => {
    if (activeStakeTab) {
      if (token) {
        const balance = token.account.data.parsed.info.tokenAmount.uiAmount
        setMaxTokenBalance(balance)
      }

      return
    }

    if (stakingToken.data) {
      const maxTokenAmount = userInfo?.stakedAmount.div(new BN(10).pow(new BN(stakingToken.data?.decimals)))
      setMaxTokenBalance(maxTokenAmount?.toNumber() || 0)
    }
  }, [activeStakeTab, userInfo, token, stakingToken.data])

  useEffect(() => {
    setRangeValue(0)
    setInputValue('')
  }, [activeStakeTab])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let targetValue = Number(e.target.value)
    if (targetValue < maxTokenBalance) {
      targetValue = Math.round(Number(e.target.value))
    }

    setRangeValue(targetValue)
    setInputValue(targetValue.toString())
  }

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

      <div className="mb-4">
        <InputNumber placeholder="Enter The Amount" value={inputValue.toString()} onChange={handleInputChange} />
        <Range max={maxTokenBalance} value={rangeValue} onChange={handleRangeChange} />
      </div>

      {activeStakeTab ? (
        <Stake address={props.address} amount={inputValue} />
      ) : (
        <UnStake address={props.address} amount={inputValue} />
      )}

      <UserStakeInfo address={props.address} />
    </div>
  )
}

interface StakingProps {
  address: PublicKey
}

interface StakingActionProps {
  address: PublicKey
  amount: string
}
