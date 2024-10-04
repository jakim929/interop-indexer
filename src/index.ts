import { ponder, type Context } from '@/generated'
import { fromHex, Hex, keccak256, toHex } from 'viem'
import { getL2ToL2CrossDomainMessageHash } from './getL2ToL2CrossDomainMessageHash'
import { Transaction } from '@ponder/core'
import { encodeL2ToL2CrossDomainSentMessageEvent } from './encodeL2ToL2CrossDomainSentMessage'
import { sortBy } from './sortBy'

ponder.on('CrossL2Inbox:ExecutingMessage', async ({ event, context }) => {
  const { ExecutingMessage, Identifier } = context.db

  const { transaction } = event
  const chainId = context.network.chainId

  await storeTransaction(
    context.db,
    chainId,
    event.block.timestamp,
    transaction,
  )

  const { msgHash: messagePayloadHash, id: identifier } = event.args
  const identifierId = getIdentifierId(identifier)

  await Identifier.upsert({
    id: identifierId,
    create: {
      chainId: identifier.chainId,
      origin: identifier.origin,
      blockNumber: identifier.blockNumber,
      logIndex: identifier.logIndex,
      timestamp: identifier.timestamp,
    },
    update: {},
  })

  // Single identifier can be submitted used multiple times, so the primary key is the ponder event id which is globally unique
  await ExecutingMessage.create({
    id: event.log.id,
    data: {
      blockHash: event.block.hash,
      messagePayloadHash,
      identifierId,
      transactionId: transaction.hash,
    },
  })
})

ponder.on(
  'L2ToL2CrossDomainMessenger:SentMessage',
  async ({ event, context }) => {
    event.log.id
    const { L2ToL2CrossDomainMessage, L2ToL2CrossDomainMessageToTransaction } =
      context.db

    const { transaction } = event
    const chainId = context.network.chainId

    await storeTransaction(
      context.db,
      chainId,
      event.block.timestamp,
      transaction,
    )

    const { destination, target, messageNonce, sender, message } = event.args

    const messageHash = getL2ToL2CrossDomainMessageHash({
      destination,
      source: BigInt(chainId),
      nonce: messageNonce,
      sender,
      target,
      message,
    })

    const newMessage = await L2ToL2CrossDomainMessage.create({
      id: messageHash,
      data: {
        sourceChainId: chainId,
        destinationChainId: Number(destination),
        target: event.args.target,
        messageNonce: event.args.messageNonce,
        sender: event.args.sender,
        message: event.args.message,
        messageHash: messageHash,
        status: 'SENT',
        lastUpdatedAt: Number(event.block.timestamp),
      },
    })

    await L2ToL2CrossDomainMessageToTransaction.create({
      id: getL2ToL2CrossDomainMessageToTransactionId(
        messageHash,
        transaction.hash,
      ),
      data: {
        eventName: 'SentMessage',
        l2ToL2CrossDomainMessageId: newMessage.id,
        transactionId: transaction.hash,
      },
    })
  },
)

ponder.on(
  'L2ToL2CrossDomainMessenger:RelayedMessage',
  async ({ event, context }) => {
    const { L2ToL2CrossDomainMessage, L2ToL2CrossDomainMessageToTransaction } =
      context.db

    const { transaction } = event
    const { messageHash } = event.args
    const chainId = context.network.chainId

    await storeTransaction(
      context.db,
      chainId,
      event.block.timestamp,
      transaction,
    )

    await L2ToL2CrossDomainMessage.update({
      id: messageHash,
      data: {
        status: 'RELAYED',
        lastUpdatedAt: Number(event.block.timestamp),
      },
    })

    await L2ToL2CrossDomainMessageToTransaction.create({
      id: getL2ToL2CrossDomainMessageToTransactionId(
        messageHash,
        transaction.hash,
      ),
      data: {
        eventName: 'RelayedMessage',
        executingMessageId: await getExecutingMessageIdForL2ToL2Message(
          context.db,
          event.block.hash,
          messageHash,
        ),
        l2ToL2CrossDomainMessageId: messageHash,
        transactionId: transaction.hash,
      },
    })
  },
)

ponder.on(
  'L2ToL2CrossDomainMessenger:FailedRelayedMessage',
  async ({ event, context }) => {
    const { L2ToL2CrossDomainMessage, L2ToL2CrossDomainMessageToTransaction } =
      context.db

    const { transaction } = event
    const { messageHash } = event.args
    const chainId = context.network.chainId

    await storeTransaction(
      context.db,
      chainId,
      event.block.timestamp,
      transaction,
    )

    await L2ToL2CrossDomainMessage.update({
      id: messageHash,
      data: {
        status: 'FAILED_RELAYED',
        lastUpdatedAt: Number(event.block.timestamp),
      },
    })

    await L2ToL2CrossDomainMessageToTransaction.create({
      id: getL2ToL2CrossDomainMessageToTransactionId(
        messageHash,
        transaction.hash,
      ),
      data: {
        eventName: 'FailedRelayedMessage',
        executingMessageId: await getExecutingMessageIdForL2ToL2Message(
          context.db,
          event.block.hash,
          messageHash,
        ),
        l2ToL2CrossDomainMessageId: messageHash,
        transactionId: transaction.hash,
      },
    })
  },
)

const getL2ToL2CrossDomainMessageToTransactionId = (
  messageHash: Hex,
  transactionHash: Hex,
) => {
  return `${messageHash}-${transactionHash}`
}

const getIdentifierId = ({
  chainId,
  blockNumber,
  logIndex,
}: {
  chainId: bigint
  blockNumber: bigint
  logIndex: bigint
}) => {
  return `${chainId}-${blockNumber}-${logIndex}`
}

const storeTransaction = async (
  db: Context['db'],
  chainId: number,
  timestamp: bigint,
  transaction: Transaction,
) => {
  return await db.Transaction.upsert({
    id: transaction.hash,
    create: {
      hash: transaction.hash,
      timestamp: Number(timestamp),
      chainId,
      from: transaction.from,
      to: transaction.to ?? undefined,
      value: transaction.value,
      data: transaction.input,
    },
    update: {}, // No need to update, these should be stable given the hash
  })
}

// This function retrieves the executing message ID for a given L2-to-L2 cross-domain message.
// It fetches the message, encodes it, finds matching executing messages, and returns the latest one.
// Assumes message exists, encoding matches on-chain event, and at least one executing message is found.
// This is okay because Ponder globally orders events across multiple chains
const getExecutingMessageIdForL2ToL2Message = async (
  db: Context['db'],
  blockHash: Hex,
  messageId: Hex,
) => {
  const message = await db.L2ToL2CrossDomainMessage.findUnique({
    id: messageId,
  })

  if (!message) {
    throw new Error(`message not found ${messageId}`)
  }

  const encodedSentMessageEvent = encodeL2ToL2CrossDomainSentMessageEvent({
    source: BigInt(message.sourceChainId),
    destination: BigInt(message.destinationChainId),
    nonce: message.messageNonce,
    sender: message.sender,
    target: message.target,
    message: message.message,
  })

  const executingMessagePayloadHash = keccak256(encodedSentMessageEvent)
  const executingMessages = await db.ExecutingMessage.findMany({
    where: {
      blockHash,
      messagePayloadHash: executingMessagePayloadHash,
    },
  })

  if (executingMessages.items.length === 0) {
    throw new Error(
      `executing message not found ${executingMessagePayloadHash}`,
    )
  }

  const executingMessageSortedByLogIndex = sortBy(
    executingMessages.items,
    (m) => fromHex(m.id.split('-')[1] as Hex, 'bigint'),
  )

  const lastExecutingMessage = executingMessageSortedByLogIndex.at(-1)!

  return lastExecutingMessage.id
}
