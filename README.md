# DefiLlama App for OpenBB Workspace

Comprehensive DeFi analytics for OpenBB Workspace powered by the DefiLlama API. Track TVL, volumes, fees, yields, and more across the entire DeFi ecosystem.

**Live Demo:** https://openbb-defillama.jose-donato.workers.dev/

## Features

- 🔍 Universal search across protocols, chains, stablecoins, DEXs, and yield pools
- 📊 39 widgets organized into 10 categories
- 📈 40+ API endpoints covering all major DeFi data
- 🆓 100% free - no paid API plan required
- ⚡ Real-time data from DefiLlama

## Quick Start

### Connect to OpenBB Workspace

1. Log in to [pro.openbb.co](https://pro.openbb.co)
2. Go to **Apps** → **Connect backend**
3. Add the backend:
   - **Name**: DefiLlama Backend
   - **URL**: `https://openbb-defillama.jose-donato.workers.dev/`
4. Click **Test** → **Add**

That's it. The app and all widgets will now be available in OpenBB Workspace.

## What's Inside

### Data Categories

- **TVL & Protocols** - Protocol rankings, chain comparisons, historical TVL
- **Stablecoins** - Market cap, chain distribution, historical data
- **Yields** - APY tracking across DeFi pools
- **DEX Volumes** - Trading volumes by protocol and chain
- **Fees & Revenue** - Protocol economics and revenue metrics
- **Bridges** - Cross-chain volume tracking
- **Options** - Derivatives protocol data
- **Open Interest** - Perpetuals and futures tracking
- **Analytics** - Global TVL, hacks, fundraising, treasuries
- **Token Prices** - Current and historical price data

### Key Endpoints

Full endpoint documentation available at the [live demo](https://openbb-defillama.jose-donato.workers.dev/).

Main endpoint patterns:
- `/defillama/protocols` - List protocols
- `/defillama/chains` - List chains
- `/defillama/stablecoins` - Stablecoin data
- `/defillama/yields/pools` - Yield pools
- `/defillama/dexs` - DEX volumes
- `/defillama/fees` - Protocol fees
- `/defillama/bridges` - Bridge volumes
- `/defillama/options` - Options protocols
- `/defillama/open-interest/*` - Perpetuals data
- `/defillama/prices/*` - Token prices

## Development

### Run Locally

```bash
git clone https://github.com/josedonato/openbb-defillama
cd openbb-defillama
bun install
bun run dev
```

Server runs at `http://localhost:5173`

### Deploy to Cloudflare Workers

```bash
bun run build
bun run deploy
```

## Tech Stack

- [Hono](https://hono.dev/) - Web framework
- [Vite](https://vitejs.dev/) - Build tool
- [DefiLlama API](https://api-docs.defillama.com/) - Data source
- [Cloudflare Workers](https://workers.cloudflare.com/) - Hosting

## License

MIT

---

Created by [@josedonato__](https://x.com/josedonato__)
