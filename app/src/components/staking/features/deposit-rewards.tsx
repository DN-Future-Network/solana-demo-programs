import { PublicKey } from '@solana/web3.js'
import { useEffect, useMemo, useState } from 'react'
import { useStakingProgram, useStakingProgramAccount } from '../staking-data-access'
import { useGetTokenBalance } from '@/components/account/account-data-access'
import { Button, InputNumber, Range } from '@/components/ui/custom'
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { amountToUiAmount } from '@/utils'
import { BN } from 'bn.js'

function DepositButton(props: Readonly<AdminActionProps>) {
  const { depositRewardsMutation } = useStakingProgramAccount({
    account: props.address,
  })

  return (
    <Button
      title="Deposit"
      disable={depositRewardsMutation.isPending}
      onClick={() => depositRewardsMutation.mutateAsync(props.amount)}
    />
  )
}

function WithdrawButton(props: Readonly<AdminActionProps>) {
  const { emergencyWithdrawMutation } = useStakingProgramAccount({
    account: props.address,
  })

  return (
    <Button
      title="Withdraw"
      disable={emergencyWithdrawMutation.isPending}
      onClick={() => emergencyWithdrawMutation.mutateAsync(props.amount)}
    />
  )
}

function AdminInfoItem({ title, value }: Readonly<{ title: string; value: string }>) {
  return (
    <div className="flex justify-between items-center text-sm mb-2">
      <div>{title}</div>
      <span className="font-bold text-black">{value}</span>
    </div>
  )
}

export function DepositRewards({ address }: Readonly<{ address: PublicKey }>) {
  const [activeDepositTab, setActiveDepositTab] = useState(true)
  const [maxTokenBalance, setMaxTokenBalance] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [rangeValue, setRangeValue] = useState(0)

  const { getStakingInfo, stakingToken, stakingInfoPDA } = useStakingProgram()

  const adminTokenBalanceQuery = useGetTokenBalance({
    mint: getStakingInfo.data?.tokenMintAddress,
    address,
    programId: TOKEN_2022_PROGRAM_ID,
  })
  const adminTokenBalance = useMemo(() => adminTokenBalanceQuery?.data?.uiAmount ?? 0, [adminTokenBalanceQuery.data])

  const vaultTokenBalanceQuery = useGetTokenBalance({
    mint: getStakingInfo.data?.tokenMintAddress,
    address: stakingInfoPDA,
    allowOwnerOffCurve: true,
    programId: TOKEN_2022_PROGRAM_ID,
  })
  const vaultTokenBalance = useMemo(() => vaultTokenBalanceQuery?.data ?? null, [vaultTokenBalanceQuery.data])

  const withdrawableAmount = useMemo(() => {
    if (!vaultTokenBalance || !getStakingInfo.data) {
      return 0
    }

    if (new BN(vaultTokenBalance.amount).lte(getStakingInfo.data.totalStaked)) {
      return 0
    }

    const amount = new BN(vaultTokenBalance.amount).sub(getStakingInfo.data.totalStaked)
    return amountToUiAmount(amount, stakingToken.data?.decimals)
  }, [vaultTokenBalance, getStakingInfo.data, stakingToken.data])

  useEffect(() => {
    setRangeValue(0)
    setInputValue('')

    if (activeDepositTab) {
      setMaxTokenBalance(adminTokenBalance)
      return
    }

    setMaxTokenBalance(withdrawableAmount)
  }, [activeDepositTab, adminTokenBalance, withdrawableAmount])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let targetValue = Math.round(Number(e.target.value))
    if (targetValue > maxTokenBalance) {
      targetValue = maxTokenBalance
    }

    setRangeValue(targetValue)
    setInputValue(targetValue.toString())
  }

  return (
    <>
      <div className="flex flex-col text-left">
        <h2 className="left-1 text-3xl text-black mb-0">Single Stake Admin</h2>
        <div className="flex flex-row text-black mt-1 mb-10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-5 mr-1"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z"
            />
          </svg>
          <p className="text-sm text-gray-300">Operate Staking Pool</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6 pb-2 border-b border-b-gray-400">
        <button
          className={`bg-none text-2xl ${activeDepositTab ? 'text-black' : 'text-gray-300'}`}
          onClick={() => setActiveDepositTab(true)}
        >
          Deposit
        </button>
        <button
          className={`bg-none text-2xl ${activeDepositTab ? 'text-gray-300' : 'text-black'}`}
          onClick={() => setActiveDepositTab(false)}
        >
          Withdraw
        </button>
      </div>

      <div className="mb-4">
        <InputNumber placeholder="Enter The Amount" value={inputValue.toString()} onChange={handleInputChange} />
        <Range max={maxTokenBalance} value={rangeValue} onChange={handleRangeChange} />
      </div>

      {activeDepositTab ? (
        <DepositButton address={address} amount={inputValue} />
      ) : (
        <WithdrawButton address={address} amount={inputValue} />
      )}

      <AdminInfoItem title="Your Token Balance" value={`${adminTokenBalance} NPG`} />
      <AdminInfoItem title="Vault Token Balance" value={`${vaultTokenBalance?.uiAmountString ?? 0} NPG`} />
      <AdminInfoItem title="Withdrawable Amount" value={`${withdrawableAmount} NPG`} />
    </>
  )
}

interface AdminActionProps {
  address: PublicKey
  amount: string
}
