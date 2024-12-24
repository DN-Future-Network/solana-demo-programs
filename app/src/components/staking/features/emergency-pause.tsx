import { PublicKey } from '@solana/web3.js'
import { useStakingProgram, useStakingProgramAccount } from '../staking-data-access'

export function EmergencyPause(props: Readonly<{ address: PublicKey }>) {
  const { getStakingInfo } = useStakingProgram()
  const { tooglePauseMutation } = useStakingProgramAccount({
    account: props.address,
  })

  return (
    <div className="form-control">
      <label className="label cursor-pointer">
        <span className="label-text text-red-400 text-lg">Emergency Pause</span>
        <input
          type="checkbox"
          className="toggle toggle-error"
          checked={getStakingInfo?.data?.isPaused}
          disabled={tooglePauseMutation.isPending}
          onChange={() => tooglePauseMutation.mutateAsync()}
        />
      </label>
    </div>
  )
}
