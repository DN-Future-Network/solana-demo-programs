import { PublicKey } from '@solana/web3.js'
import { useEffect, useMemo, useState } from 'react'
import { useStakingProgram, useStakingProgramAccount } from '../staking-data-access'
import { useGetTokenAccount } from '@/components/account/account-data-access'
import { Button, InputNumber, Range } from '@/components/ui/custom'
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { amountToUiAmount } from '@/utils'

function StakeButton(props: Readonly<StakingActionProps>) {
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

function UnStakeButton(props: Readonly<StakingActionProps>) {
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

function UserStakeInfoItem({ title, value }: Readonly<{ title: string; value: string }>) {
  return (
    <div className="flex justify-between items-center text-sm mb-2">
      <div>{title}</div>
      <span className="font-bold text-black">{value}</span>
    </div>
  )
}

export function Stake({ address }: Readonly<{ address: PublicKey }>) {
  const [activeStakeTab, setActiveStakeTab] = useState(true)
  const [maxTokenBalance, setMaxTokenBalance] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [rangeValue, setRangeValue] = useState(0)

  const { stakingToken } = useStakingProgram()
  const tokenAccountQuery = useGetTokenAccount({
    mint: stakingToken.data?.address,
    address,
    programId: TOKEN_2022_PROGRAM_ID,
  })
  const tokenAccount = useMemo(() => tokenAccountQuery?.data ?? null, [tokenAccountQuery.data])

  const { accountQuery } = useStakingProgramAccount({
    account: address,
  })
  const userInfo = useMemo(() => accountQuery.data ?? null, [accountQuery.data])

  useEffect(() => {
    setRangeValue(0)
    setInputValue('')

    if (activeStakeTab) {
      setMaxTokenBalance(tokenAccount ? amountToUiAmount(tokenAccount.amount, stakingToken.data?.decimals) : 0)
      return
    }

    setMaxTokenBalance(userInfo ? amountToUiAmount(userInfo?.stakedAmount, stakingToken.data?.decimals) : 0)
  }, [activeStakeTab, userInfo, tokenAccount, stakingToken.data])

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
        <StakeButton address={address} amount={inputValue} />
      ) : (
        <UnStakeButton address={address} amount={inputValue} />
      )}

      <div>
        <UserStakeInfoItem
          title="Token Balance"
          value={`${amountToUiAmount(tokenAccount?.amount, stakingToken.data?.decimals)} NPG`}
        />
        <UserStakeInfoItem
          title="Token Staked"
          value={`${amountToUiAmount(userInfo?.stakedAmount, stakingToken.data?.decimals)} NPG`}
        />
      </div>
    </div>
  )
}

interface StakingActionProps {
  address: PublicKey
  amount: string
}
