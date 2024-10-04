import { createSchema } from '@ponder/core'

export default createSchema((p) => ({
  MessageStatus: p.createEnum(['SENT', 'FAILED_RELAYED', 'RELAYED']),
  MessageEventName: p.createEnum([
    'SentMessage',
    'FailedRelayedMessage',
    'RelayedMessage',
  ]),

  ExecutingMessage: p.createTable(
    {
      id: p.string(), // `${event.log.id}` aka `${blockHash}-${logIndex}` ponder event globally unique id,

      blockHash: p.hex(),

      // Payload of the message
      messagePayloadHash: p.hex(),

      identifierId: p.string().references('Identifier.id'),
      identifier: p.one('identifierId'),

      transactionId: p.hex().references('Transaction.id'),
      transaction: p.one('transactionId'),
    },
    {
      blockHashMessagePayloadHashIndex: p.index([
        'blockHash',
        'messagePayloadHash',
      ]),
    },
  ),

  Identifier: p.createTable({
    id: p.string(), // `${chainId}-${blockHash}-${logIndex}`,

    origin: p.hex(),
    blockNumber: p.bigint(),
    logIndex: p.bigint(),
    timestamp: p.bigint(),
    chainId: p.bigint(),
  }),

  L2ToL2CrossDomainMessage: p.createTable({
    id: p.hex(), // messageHash

    sourceChainId: p.int(),

    // Event log payload
    destinationChainId: p.int(),
    target: p.hex(),
    messageNonce: p.bigint(),
    sender: p.hex(),
    message: p.hex(),

    messageHash: p.hex(),

    status: p.enum('MessageStatus'),

    lastUpdatedAt: p.int(),

    l2ToL2CrossDomainMessageToTransactions: p.many(
      'L2ToL2CrossDomainMessageToTransaction.l2ToL2CrossDomainMessageId',
    ),
  }),

  Transaction: p.createTable({
    id: p.hex(), // hash
    hash: p.hex(),
    timestamp: p.int(),
    chainId: p.int(),
    from: p.hex(),
    to: p.hex().optional(),
    value: p.bigint(),
    data: p.hex(),
    l2ToL2CrossDomainMessageToTransaction: p.many(
      'L2ToL2CrossDomainMessageToTransaction.transactionId',
    ),
    executingMessages: p.many('ExecutingMessage.transactionId'),
  }),

  // Join table between message <> transaction since it can be many to many
  // One transaction can relay many messages
  // One message can be failed relayed by many transactions, but only relayed successfully by one
  L2ToL2CrossDomainMessageToTransaction: p.createTable(
    {
      id: p.string(), // `${L2ToL2CrossDomainMessage.id}-${Transaction.id}`,

      eventName: p.enum('MessageEventName'),

      executingMessageId: p
        .string()
        .references('ExecutingMessage.id')
        .optional(),
      executingMessage: p.one('executingMessageId'),

      l2ToL2CrossDomainMessageId: p
        .hex()
        .references('L2ToL2CrossDomainMessage.id'),
      transactionId: p.hex().references('Transaction.id'),
      l2ToL2CrossDomainMessage: p.one('l2ToL2CrossDomainMessageId'),
      transaction: p.one('transactionId'),
    },
    {
      transactionIdIndex: p.index('transactionId'),
      l2ToL2CrossDomainMessageIdIndex: p.index('l2ToL2CrossDomainMessageId'),
    },
  ),
}))
