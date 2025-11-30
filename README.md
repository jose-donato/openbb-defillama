# DefiLlama App for OpenBB Workspace

A comprehensive DeFi analytics platform for OpenBB Workspace powered by the DefiLlama API. Search, analyze, and visualize data across the entire DeFi ecosystem including protocols, chains, stablecoins, DEXs, yield pools, bridges, options, security incidents, fundraising, and more.

**Features:**
- 🔍 **Universal Search** - Find protocols, chains, stablecoins, DEXs, and yield pools instantly
- 📊 **39 Widgets** across 10 organized categories
- 📈 **40+ API Endpoints** covering all major DeFi data
- 🆓 **100% Free** - No paid API plan required
- ⚡ **Real-time Data** - Live TVL, volumes, fees, and yields
- 🔒 **Security Tracking** - Monitor hacks and exploits
- 💰 **Financial Analytics** - Fees, revenue, fundraising, and treasuries

## Connecting to OpenBB Workspace

Follow these steps to connect this backend as a data source in OpenBB Pro:

1. Log in to your OpenBB Pro account at [pro.openbb.co](https://pro.openbb.co)
2. Navigate to the **Apps** page
3. Click the **Connect backend** button
4. Fill in the following details:
   - **Name**: DefiLlama Backend
   - **URL**: `https://openbb-defillama.YOUR-DOMAIN.workers.dev/` (replace with your deployed URL)
5. Click the **Test** button to verify the connection
6. If the test is successful, click the **Add** button

Once added, you'll find DefiLlama app available in the Apps section of OpenBB Workspace.

## Available Widgets

This backend provides **39 widgets** organized into **10 tabs**:

### Search (5 widgets)
- **Search Protocols** - Search and filter DeFi protocols by name, category, or chain
- **Search Chains** - Search and filter blockchain networks by name or TVL
- **Search Stablecoins** - Search and filter stablecoins by name or symbol
- **Search DEXs** - Search and filter decentralized exchanges by name or chain
- **Search Yield Pools** - Search and filter yield farming pools by project, chain, or APY

### TVL & Protocols (6 widgets)
- **Protocols List** - List all DeFi protocols with their TVL and statistics
- **Chains List** - List all chains with their total TVL
- **Chains TVL Chart** - Bar chart showing TVL distribution across chains
- **Protocol TVL History** - Historical TVL chart for a specific protocol
- **Chain TVL History** - Historical TVL data for a specific chain
- **DeFi Categories** - List all protocol categories with TVL and protocol count

### Stablecoins (4 widgets)
- **Stablecoins List** - List all stablecoins with circulating supply and market cap
- **Stablecoin History** - Historical market cap for a specific stablecoin
- **Stablecoins by Chain** - Stablecoin market cap distribution across chains
- **Stablecoins Market Cap Chart** - Historical market cap of all stablecoins

### Yields/APY (2 widgets)
- **Yield Pools** - List all yield farming pools with APY data
- **Pool APY History** - Historical APY chart for a specific pool

### DEX Volumes (4 widgets)
- **DEX Volumes** - List all DEXs with volume statistics
- **DEX Volumes by Chain** - DEX volumes filtered by blockchain
- **DEX Volume Summary** - Detailed volume data for a specific DEX
- **DEX Volume Chart** - Historical volume chart for a DEX

### Fees & Revenue (4 widgets)
- **Protocol Fees & Revenue** - List all protocols with fees and revenue data
- **Fees by Chain** - Protocol fees filtered by blockchain
- **Protocol Fees Summary** - Detailed fees data for a specific protocol
- **Protocol Fees Chart** - Historical fees chart for a protocol

### Bridges (2 widgets)
- **Cross-Chain Bridges** - List all cross-chain bridges with volume data
- **Bridge Details** - Detailed information for a specific bridge

### Options/Derivatives (3 widgets)
- **Options Protocols** - List all options and derivatives protocols
- **Options by Chain** - Options protocols filtered by blockchain
- **Options Protocol Summary** - Detailed volume data for a specific options protocol

### Analytics & Research (7 widgets)
- **Global DeFi TVL Chart** - Historical chart of total DeFi TVL
- **DeFi Hacks & Exploits** - List all security incidents and hacks
- **Protocol Fundraising** - List all protocol funding rounds and raises
- **Protocol Treasuries** - List all protocol treasury holdings
- **Current Token Prices** - Get current prices for tokens
- **Historical Token Prices** - Get historical prices for tokens

## Available Endpoints

### TVL Endpoints
- `GET /defillama/protocols` - List all protocols with their TVL and key statistics
- `GET /defillama/protocol/:slug` - Get detailed information about a specific protocol
- `GET /defillama/protocol/:slug/tvl` - Get historical TVL data for a protocol
- `GET /defillama/chains` - List all chains with their current TVL
- `GET /defillama/chain/:chain` - Get historical TVL for a specific chain
- `GET /defillama/categories` - Get all protocol categories with TVL
- `GET /defillama/charts/chains` - Plotly bar chart of TVL by chain (top 20)
- `GET /defillama/charts/protocol/:slug` - Plotly line chart of historical TVL for a protocol

### Stablecoin Endpoints
- `GET /defillama/stablecoins` - List all stablecoins with circulating amounts
- `GET /defillama/stablecoin/:asset` - Get historical market cap for a specific stablecoin
- `GET /defillama/stablecoins/chains` - Get stablecoin market cap by chain
- `GET /defillama/stablecoins/charts/all` - Get historical stablecoin market cap data
- `GET /defillama/charts/stablecoins` - Plotly chart of stablecoin market cap over time

### Yields/APY Endpoints
- `GET /defillama/yields/pools` - List all yield farming pools with APY data
- `GET /defillama/yields/chart/:pool` - Get historical APY for a specific pool

### DEX Volume Endpoints
- `GET /defillama/dexs` - List all DEXs with volume summaries
- `GET /defillama/dexs/:chain` - Get DEX volumes filtered by chain
- `GET /defillama/dexs/summary/:protocol` - Get detailed volume data for a specific DEX
- `GET /defillama/charts/dex/:protocol` - Plotly chart of DEX volume history

### Fees & Revenue Endpoints
- `GET /defillama/fees` - List all protocols with fees and revenue data
- `GET /defillama/fees/:chain` - Get protocol fees filtered by chain
- `GET /defillama/fees/summary/:protocol` - Get detailed fees data for a specific protocol
- `GET /defillama/charts/fees/:protocol` - Plotly chart of protocol fees history

### Bridges Endpoints
- `GET /defillama/bridges` - List all cross-chain bridges with volume data
- `GET /defillama/bridge/:id` - Get detailed information for a specific bridge

### Options/Derivatives Endpoints
- `GET /defillama/options` - List all options and derivatives protocols
- `GET /defillama/options/:chain` - Get options protocols filtered by chain
- `GET /defillama/options/summary/:protocol` - Get detailed volume data for a specific options protocol

### Analytics & Research Endpoints
- `GET /defillama/hacks` - List all DeFi security incidents and hacks
- `GET /defillama/raises` - List all protocol funding rounds and raises
- `GET /defillama/treasuries` - List all protocol treasury holdings
- `GET /defillama/charts/global-tvl` - Plotly chart of global DeFi TVL over time

### Token Price Endpoints
- `GET /defillama/prices/current/:coins` - Get current prices for tokens by contract address
- `GET /defillama/prices/historical/:timestamp/:coins` - Get historical prices for tokens at a specific timestamp

## Running Locally

To run this project locally, follow these steps:

1.  **Prerequisites:**
    *   Ensure you have [Node.js](https://nodejs.org/) installed or [Bun](https://bun.sh/).

2.  **Clone the Repository:**
    ```bash
    git clone https://github.com/YOUR-USERNAME/openbb-defillama
    cd openbb-defillama
    ```

3.  **Install Dependencies:**
    ```bash
    bun install # or npm install, yarn, pnpm
    ```

4.  **Start the Development Server:**
    ```bash
    bun run dev # or npm run dev, yarn dev, pnpm dev
    ```
    This command will start a local server at `http://localhost:5173`, where you can test the endpoints and view the setup instructions.

## Deploying to Cloudflare Workers

1.  **Build the project:**
    ```bash
    bun run build # or npm run build
    ```

2.  **Deploy to Cloudflare Workers:**
    ```bash
    bun run deploy # or npm run deploy
    ```

## API Documentation

For more information about the DefiLlama API, visit the [official API documentation](https://api-docs.defillama.com/).

## Technology Stack

- [Hono](https://hono.dev/) - Web framework for Cloudflare Workers
- [Vite](https://vitejs.dev/) - Build tool
- [DefiLlama API](https://api.llama.fi) - DeFi TVL data source
- [Cloudflare Workers](https://workers.cloudflare.com/) - Serverless deployment platform

## License

MIT
