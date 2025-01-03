import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '../solana/solana-provider'
import { AppHero } from '../ui/ui-layout'
import StakingUi from './features'

export default function StakingFeature() {
  const { publicKey } = useWallet()

  return publicKey ? (
    <AppHero title="Staking" subtitle={''}>
      <StakingUi address={publicKey} />
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
