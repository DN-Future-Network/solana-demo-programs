import { amountToUiAmount } from '@/utils'
import { useStakingProgram } from '../staking-data-access'
import moment from 'moment'

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
  const { getStakingInfo } = useStakingProgram()
  const data = getStakingInfo.data

  return (
    <div className="mb-8">
      <h2 className="left-0 text-3xl text-white mb-8">Pool Information</h2>
      <PoolInfoItem title="APY" value={`${data ? data?.interestRate / 100 : 0}%`} />
      <PoolInfoItem title="TOTAL STAKED" value={`${amountToUiAmount(data?.totalStaked)} NPG`} />
      <PoolInfoItem title="LIMIT" value={`${amountToUiAmount(data?.maxTokenAmountPerAddress)} NPG`} />
      <PoolInfoItem title="START TIME" value={data ? toLocaleDateTimeString(data.startTime.toNumber()) : ''} />
      <PoolInfoItem title="END TIME" value={data ? toLocaleDateTimeString(data.endTime.toNumber()) : ''} />
    </div>
  )
}

interface PoolInfoItemProps {
  title: string
  value: string
}
