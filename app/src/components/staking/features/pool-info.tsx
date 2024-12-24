import { amountToUiAmount } from '@/utils'
import { useStakingProgram } from '../staking-data-access'
import moment from 'moment'
import { useMemo } from 'react'

function toLocaleDateTimeString(timestamp: number): string {
  return moment(timestamp * 1000).format('DD/MM/YYYY hh:mm')
}

function PoolInfoItem(props: Readonly<PoolInfoItemProps>) {
  return (
    <div className="flex justify-between items-center mb-6 pb-2 border-b-4 border-gray-500">
      <span className="text-xl font-bold text-white">{props.value}</span>
      <span className="text-base text-white">{props.title}</span>
    </div>
  )
}

export function PoolInfo() {
  const { getStakingInfo, stakingToken } = useStakingProgram()
  const stakingInfo = useMemo(() => getStakingInfo.data, [getStakingInfo.data])

  return (
    <div className="flex flex-col justify-between mb-8">
      <h2 className="text-3xl text-white mb-8">Pool Information</h2>
      <PoolInfoItem title="APY" value={`${stakingInfo ? stakingInfo?.interestRate / 100 : 0}%`} />
      <PoolInfoItem
        title="TOTAL STAKED"
        value={`${amountToUiAmount(stakingInfo?.totalStaked, stakingToken.data?.decimals)} NPG`}
      />
      <PoolInfoItem
        title="LIMIT"
        value={`${amountToUiAmount(stakingInfo?.maxTokenAmountPerAddress, stakingToken.data?.decimals)} NPG`}
      />
      <PoolInfoItem
        title="START TIME"
        value={stakingInfo ? toLocaleDateTimeString(stakingInfo.startTime.toNumber()) : ''}
      />
      <PoolInfoItem
        title="END TIME"
        value={stakingInfo ? toLocaleDateTimeString(stakingInfo.endTime.toNumber()) : ''}
      />
    </div>
  )
}

interface PoolInfoItemProps {
  title: string
  value: string
}
