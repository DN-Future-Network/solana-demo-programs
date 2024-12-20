import BN from 'bn.js'

export function amountToUiAmount(amount: bigint | BN | undefined, decimals = 6): number {
  if (!amount) {
    return 0
  }

  if (typeof amount === 'bigint') {
    return Number(amount) / 10 ** decimals
  }

  return amount.toNumber() / 10 ** decimals
}
