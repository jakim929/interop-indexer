import { Address, Hex } from 'viem'

export type L2ToL2CrossDomainMessage = {
  destination: bigint
  source: bigint
  nonce: bigint
  sender: Address
  target: Address
  message: Hex
}
