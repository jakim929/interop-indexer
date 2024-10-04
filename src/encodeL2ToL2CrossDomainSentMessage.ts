import {
  encodeAbiParameters,
  encodeEventTopics,
  encodePacked,
  toHex,
} from 'viem'
import { L2ToL2CrossDomainMessengerAbi } from '../abis/L2ToL2CrossDomainMessengerAbi'
import { L2ToL2CrossDomainMessage } from './types'

export const encodeL2ToL2CrossDomainSentMessageEvent = (
  message: L2ToL2CrossDomainMessage,
) => {
  const topics = encodeEventTopics({
    abi: L2ToL2CrossDomainMessengerAbi,
    eventName: 'SentMessage',
    args: {
      destination: message.destination,
      target: message.target,
      messageNonce: message.nonce,
    },
  })

  console.log('message', message)

  const data = encodeAbiParameters(
    [{ type: 'address' }, { type: 'bytes' }],
    [message.sender, message.message],
  )

  if (topics === null || !Array.isArray(topics)) {
    throw new Error('Failed to encode event topics')
  }

  // TODO: MAYBE is a bug in viem? but prob not. either way when messageNonce is 0n, the topic is null
  if (topics[3] === null) {
    topics[3] = toHex(message.nonce, { size: 32 })
  }

  console.log('topics', topics)

  return encodePacked(['bytes32[]', 'bytes'], [topics as `0x${string}`[], data])
}
