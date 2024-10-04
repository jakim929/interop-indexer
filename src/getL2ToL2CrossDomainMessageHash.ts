import { keccak256, encodeAbiParameters, Address, Hex } from 'viem'
import { L2ToL2CrossDomainMessage } from './types'

/**
 * Generates a unique hash for cross L2 messages. This hash is used to identify
 * the message and ensure it is not relayed more than once.
 * @param messageParams Object containing all parameters for the cross-domain message.
 * @returns Hash of the encoded message parameters, used to uniquely identify the message.
 */
export function getL2ToL2CrossDomainMessageHash(
  messageParams: L2ToL2CrossDomainMessage,
): Hex {
  const { destination, source, nonce, sender, target, message } = messageParams

  const encodedParams = encodeAbiParameters(
    [
      { type: 'uint256' },
      { type: 'uint256' },
      { type: 'uint256' },
      { type: 'address' },
      { type: 'address' },
      { type: 'bytes' },
    ],
    [destination, source, nonce, sender, target, message],
  )

  return keccak256(encodedParams)
}
