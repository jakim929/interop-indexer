import { createConfig } from '@ponder/core'
import { http } from 'viem'

import { L2ToL2CrossDomainMessengerAbi } from './abis/L2ToL2CrossDomainMessengerAbi'
import { CrossL2InboxAbi } from './abis/CrossL2InboxAbi'

export default createConfig({
  networks: {
    opChainA: {
      chainId: 901,
      transport: http(process.env.PONDER_RPC_URL_901),
    },
    opChainB: {
      chainId: 902,
      transport: http(process.env.PONDER_RPC_URL_902),
    },
  },
  contracts: {
    L2ToL2CrossDomainMessenger: {
      address: '0x4200000000000000000000000000000000000023',
      network: {
        opChainA: {},
        opChainB: {},
      },
      abi: L2ToL2CrossDomainMessengerAbi,
      startBlock: 0,
    },
    CrossL2Inbox: {
      address: '0x4200000000000000000000000000000000000022',
      network: {
        opChainA: {},
        opChainB: {},
      },
      abi: CrossL2InboxAbi,
      startBlock: 0,
    },
  },
})
