import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '../solana/solana-provider'
import { AppHero } from '../ui/ui-layout'
import { StakePanel, RewardsPanel } from './staking-ui'

export default function StakingFeature() {
  const { publicKey } = useWallet()

  return publicKey ? (
    <AppHero title="Staking" subtitle={''}>
      <div className="flex flex-col lg:flex-row justify-center items-center bg-gradient-to-br from-green-500 to-gray-900 text-white p-8 rounded-lg shadow-lg">
        <StakePanel address={publicKey} />
        <RewardsPanel address={publicKey} />
      </div>
    </AppHero>
  ) : (
    <div className="max-w-4xl mx-auto">
      <div className="hero py-[64px]">
        <div className="hero-content text-center">
          <WalletButton />
        </div>
      </div>
    </div>
  )
}
