# ⏺️ Superchain Interoperability Indexer

A [Ponder](https://github.com/ponder-sh/ponder)-based indexer for the Superchain interoperability contracts: [CrossL2Inbox](https://specs.optimism.io/interop/predeploys.html#crossl2inbox) and [L2ToL2CrossDomainMessenger](https://specs.optimism.io/interop/predeploys.html#l2tol2crossdomainmessenger) .



| <img width="471" alt="image" src="https://github.com/user-attachments/assets/0c6f2ffb-448b-48d6-90af-092988705c66"> | <img width="782" alt="Screenshot 2024-10-04 at 3 14 13 PM" src="https://github.com/user-attachments/assets/75df19fa-e4d5-417e-b184-b2f230801a35"> |
|---|---|


## ✨ Features

- Indexes cross-domain messages between L2 networks within the Superchain ecosystem
- Tracks the complete lifecycle of L2-to-L2 cross-domain messages:
  - Sent messages
  - Relayed messages
  - Failed relayed messages
- Stores comprehensive data including transaction details, identifiers, and `ExecutingMessage` associated with cross-chain message events

## 🚀 Getting Started (Local Development)

Follow these steps to set up and run the indexer locally:

1. **Set up Superchain Simulator:**
   Start a Superchain simulator like [supersim](https://github.com/ethereum-optimism/supersim).

2. **Clone the Repository:**

   ```sh
   git clone https://github.com/jakim929/interop-indexer.git
   cd interop-indexer
   ```

3. **Install Dependencies:**
   We use `pnpm` as our package manager. Install the dependencies with:

   ```sh
   pnpm install
   ```

4. **Configure Environment:**
   Create a local environment file:

   ```sh
   cp .env.example .env.local
   ```

   Open `.env.local` and update it with your specific RPC URLs and any other required configurations. The default config will work with the default networks in `supersim`

5. **Run the Indexer:**
   Start the indexer in development mode:
   ```sh
   pnpm dev
   ```

Go to http://localhost:42069/ to see the GraphQL UI!
