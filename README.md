# DefiLlama App for OpenBB Workspace

An OpenBB Workspace app that connects to the DefiLlama API, enabling the integration of DeFi TVL data and analytics. It defines widgets for visualizing protocol TVL, chain analytics, and historical DeFi metrics within the OpenBB Workspace interface.

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

This backend provides the following widgets for analyzing DeFi data:

- **Protocols List** - List all DeFi protocols with their TVL and statistics
- **Chains List** - List all chains with their total TVL
- **Chains TVL Chart** - Bar chart showing TVL distribution across chains
- **Protocol TVL History** - Historical TVL chart for a specific protocol
- **Chain TVL History** - Historical TVL data for a specific chain

## Available Endpoints

### GET /defillama/protocols
List all protocols with their TVL and key statistics.

### GET /defillama/protocol/:slug
Get detailed information about a specific protocol (e.g., `/defillama/protocol/aave`).

### GET /defillama/protocol/:slug/tvl
Get historical TVL data for a protocol.

### GET /defillama/chains
List all chains with their current TVL.

### GET /defillama/chain/:chain
Get historical TVL for a specific chain (e.g., `/defillama/chain/Ethereum`).

### GET /defillama/charts/chains
Get a Plotly bar chart of TVL by chain (top 20).

### GET /defillama/charts/protocol/:slug
Get a Plotly line chart of historical TVL for a protocol.

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
