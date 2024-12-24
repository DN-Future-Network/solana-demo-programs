import { Stake } from './stake'
import { PoolInfo } from './pool-info'
import { ClaimRewards } from './claim-rewards'
import { PublicKey } from '@solana/web3.js'
import { useStakingProgramAccount } from '../staking-data-access'
import { DepositRewards } from './deposit-rewards'
import { EmergencyPause } from './emergency-pause'

export default function StakingUi({ address }: Readonly<{ address: PublicKey }>) {
  const { isAdmin } = useStakingProgramAccount({ account: address })

  if (isAdmin == null) {
    return null
  }

  return (
    <div className="grid grid-cols-2 justify-center text-white rounded-lg shadow-lg">
      <div className="bg-gradient-to-b from-stake-bg-from to-stake-bg-to p-8 pr-20 rounded-3xl h-full">
        {isAdmin ? <DepositRewards address={address} /> : <Stake address={address} />}
      </div>
      <div className="bg-reward p-8 rounded-3xl h-full -ml-10">
        <PoolInfo />
        {isAdmin ? <EmergencyPause address={address} /> : <ClaimRewards address={address} />}
      </div>
    </div>
  )
}
