import { Hono } from "hono";
import { html } from 'hono/html'
import { cors } from "hono/cors";
import defillama from "./defillama";
import { renderer } from "./renderer";

const app = new Hono();

app.use(renderer);

app.use(
	cors({
		origin: ["https://pro.openbb.co", "https://excel.openbb.co", "http://localhost:1420", "https://pro.openbb.dev"],
	})
);

app.get("/", (c) => {
	return c.html(
		<html>
			<head>
				<title>DefiLlama App for OpenBB Workspace</title>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
				{html`
          <script>
					function copyUrl() {
						const url = 'https://openbb-defillama.jose-donato.workers.dev/';
						navigator.clipboard.writeText(url).then(() => {
							const copyIcon = document.getElementById('copyIcon');
							const checkIcon = document.getElementById('checkIcon');
							const btn = document.getElementById('copyUrlBtn');

							copyIcon.classList.add('hidden');
							checkIcon.classList.remove('hidden');
							btn.classList.add('text-green-400');

							setTimeout(() => {
								copyIcon.classList.remove('hidden');
								checkIcon.classList.add('hidden');
								btn.classList.remove('text-green-400');
							}, 2000);
						});
					}
				</script>`}
			</head>
			<body>
				<div class="flex min-h-screen flex-col items-center justify-center bg-gray-900 py-6">
					<div style="display: flex; flex-direction: column; align-items: center;"
						class="container max-w-3xl px-4 flex flex-col items-center">
						<div class="flex items-center gap-2 text-xl font-bold text-white mb-6">
							<img src="https://defillama.com/icons/defillama.webp" alt="DefiLlama" class="h-20 w-auto" />
						</div>

						<div class="text-center space-y-4 mb-8">
							<h1 class="text-3xl font-bold tracking-tight text-white sm:text-4xl">
								DefiLlama App for OpenBB Workspace
							</h1>
						</div>

						<p class="text-sm text-gray-300 text-center mb-6">DeFi TVL and analytics dashboard</p>

						<p class="text-sm text-gray-300 text-center mb-6">Created by <a href="https://x.com/josedonato__" class="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">@josedonato__</a></p>

						<div class="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
							<h2 class="text-lg font-semibold text-white mb-4">How to Add to OpenBB Workspace</h2>
							<ol class="list-decimal list-inside space-y-2 text-sm text-gray-300">
								<li>Log in to your OpenBB account at <a href="https://pro.openbb.co" class="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">pro.openbb.co</a></li>
								<li>Navigate to the <strong>Apps</strong> page</li>
								<li>Click the <strong>Connect backend</strong> button</li>
								<li>Fill in the following details:
									<ul class="list-disc list-inside ml-4 mt-1 space-y-1">
										<li>
											<strong>Name</strong>: DefiLlama Backend
										</li>
										<li>
											<strong>URL</strong>:
											<span class="inline-flex items-center gap-2">
												<code class="ml-1 bg-gray-700 text-gray-200 px-1 py-0.5 rounded">https://openbb-defillama.jose-donato.workers.dev/</code>
												<button
													id="copyUrlBtn"
													class="text-gray-400 hover:text-white transition-colors duration-200"
													onclick="copyUrl()"
												>
													<svg id="copyIcon" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
													</svg>
													<svg id="checkIcon" class="w-4 h-4 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
													</svg>
												</button>
											</span>
										</li>
									</ul>
								</li>
								<li>Click <strong>Test</strong> to verify the connection</li>
								<li>If the test is successful, click <strong>Add</strong></li>
							</ol>
							<p class="text-sm text-gray-300 mt-4">Once added, you'll find DefiLlama app available in the Apps section of OpenBB Workspace. All the widgets will also be available in search to add to your dashboards.</p>
						</div>

						<div class="flex flex-col gap-4 items-center mt-6">
							<a href="https://github.com/jose-donato/openbb-defillama" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200 shadow-lg hover:shadow-xl">
								<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
									<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
								</svg>
								Star on GitHub
							</a>
						</div>
					</div>
				</div>
			</body>
		</html>
	);
});

app.get("/apps.json", (c) => {
	return c.json([{
		"name": "DefiLlama",
		"img": "https://blockzeit.com/wp-content/uploads/2023/05/DeFiLlama.png",
		"img_dark": "https://blockzeit.com/wp-content/uploads/2023/05/DeFiLlama.png",
		"img_light": "https://blockzeit.com/wp-content/uploads/2023/05/DeFiLlama.png",
		"description": "Comprehensive DeFi analytics platform powered by DefiLlama API. Search and analyze protocols, chains, stablecoins, DEXs, and yield pools. Track TVL, volumes, fees, bridges, options, security incidents, fundraising, and more across the entire DeFi ecosystem.",
		"allowCustomization": true,
		"tabs": {
			"search": {
				"id": "search",
				"name": "Search",
				"layout": [
					{
						"i": "search_protocols",
						"x": 0,
						"y": 2,
						"w": 20,
						"h": 20,
						"state": {
							"chartView": {
								"enabled": false,
								"chartType": "line"
							}
						},
						"groups": []
					},
					{
						"i": "search_chains",
						"x": 20,
						"y": 2,
						"w": 20,
						"h": 20,
						"state": {
							"chartView": {
								"enabled": false,
								"chartType": "line"
							}
						},
						"groups": []
					},
					{
						"i": "search_stablecoins",
						"x": 0,
						"y": 22,
						"w": 20,
						"h": 15,
						"state": {
							"chartView": {
								"enabled": false,
								"chartType": "line"
							}
						},
						"groups": []
					},
					{
						"i": "search_dexs",
						"x": 20,
						"y": 22,
						"w": 20,
						"h": 15,
						"state": {
							"chartView": {
								"enabled": false,
								"chartType": "line"
							}
						},
						"groups": []
					},
					{
						"i": "search_yields",
						"x": 0,
						"y": 37,
						"w": 40,
						"h": 15,
						"state": {
							"chartView": {
								"enabled": false,
								"chartType": "line"
							}
						},
						"groups": []
					}
				]
			},
			"overview": {
				"id": "overview",
				"name": "Overview",
				"layout": [
					{
						"i": "global_tvl_chart",
						"x": 0,
						"y": 2,
						"w": 40,
						"h": 15,
						"state": {
							"chartModel": {
								"modelType": "range",
								"chartType": "line",
								"chartOptions": {},
								"suppressChartRanges": true
							},
							"chartView": {
								"enabled": true,
								"chartType": "line"
							}
						},
						"groups": []
					},
					{
						"i": "protocols_list",
						"x": 0,
						"y": 17,
						"w": 40,
						"h": 20,
						"state": {
							"chartView": {
								"enabled": false,
								"chartType": "line"
							}
						},
						"groups": []
					},
					{
						"i": "chains_list",
						"x": 0,
						"y": 37,
						"w": 40,
						"h": 12,
						"state": {
							"chartView": {
								"enabled": false,
								"chartType": "line"
							}
						},
						"groups": []
					},
					{
						"i": "chains_chart",
						"x": 0,
						"y": 49,
						"w": 40,
						"h": 15,
						"state": {
							"chartModel": {
								"modelType": "range",
								"chartType": "bar",
								"chartOptions": {},
								"suppressChartRanges": true
							},
							"chartView": {
								"enabled": true,
								"chartType": "bar"
							}
						},
						"groups": []
					}
				]
			},
			"stablecoins": {
				"id": "stablecoins",
				"name": "Stablecoins",
				"layout": [
					{
						"i": "stablecoins_list",
						"x": 0,
						"y": 2,
						"w": 40,
						"h": 18,
						"state": {
							"chartView": {
								"enabled": false,
								"chartType": "line"
							}
						},
						"groups": []
					},
					{
						"i": "stablecoins_chart",
						"x": 0,
						"y": 20,
						"w": 40,
						"h": 14,
						"state": {
							"chartModel": {
								"modelType": "range",
								"chartType": "line",
								"chartOptions": {},
								"suppressChartRanges": true
							},
							"chartView": {
								"enabled": true,
								"chartType": "line"
							}
						},
						"groups": []
					},
					{
						"i": "stablecoins_by_chain",
						"x": 0,
						"y": 34,
						"w": 40,
						"h": 12,
						"state": {
							"chartView": {
								"enabled": false,
								"chartType": "line"
							}
						},
						"groups": []
					}
				]
			},
			"yields": {
				"id": "yields",
				"name": "Yields",
				"layout": [
					{
						"i": "yields_pools",
						"x": 0,
						"y": 2,
						"w": 40,
						"h": 25,
						"state": {
							"chartView": {
								"enabled": false,
								"chartType": "line"
							}
						},
						"groups": []
					}
				]
			},
			"dexs": {
				"id": "dexs",
				"name": "DEX Volumes",
				"layout": [
					{
						"i": "dexs_list",
						"x": 0,
						"y": 2,
						"w": 40,
						"h": 25,
						"state": {
							"chartView": {
								"enabled": false,
								"chartType": "line"
							}
						},
						"groups": []
					}
				]
			},
			"fees": {
				"id": "fees",
				"name": "Fees & Revenue",
				"layout": [
					{
						"i": "fees_list",
						"x": 0,
						"y": 2,
						"w": 40,
						"h": 25,
						"state": {
							"chartView": {
								"enabled": false,
								"chartType": "line"
							},
							"columnState": {
								"default": {
									"sort": {
										"sortModel": [
											{
												"colId": "revenue30d",
												"sort": "desc"
											}
										]
									}
								}
							}
						},
						"groups": []
					}
				]
			},
			"bridges": {
				"id": "bridges",
				"name": "Bridges",
				"layout": [
					{
						"i": "bridges_list",
						"x": 0,
						"y": 2,
						"w": 40,
						"h": 25,
						"state": {
							"chartModel": {
								"modelType": "range",
								"chartType": "groupedColumn",
								"chartOptions": {},
								"cellRange": {
									"columns": [
										"displayName"
									]
								},
								"suppressChartRanges": true
							},
							"chartView": {
								"enabled": false,
								"chartType": "groupedColumn"
							}
						},
						"groups": []
					}
				]
			},
			"options": {
				"id": "options",
				"name": "Options",
				"layout": [
					{
						"i": "options_list",
						"x": 0,
						"y": 2,
						"w": 40,
						"h": 25,
						"state": {
							"chartView": {
								"enabled": false,
								"chartType": "line"
							}
						},
						"groups": []
					}
				]
			},
			"open_interest": {
				"id": "open_interest",
				"name": "Open Interest",
				"layout": [
					{
						"i": "open_interest_stats",
						"x": 0,
						"y": 2,
						"w": 40,
						"h": 10,
						"state": {
							"chartView": {
								"enabled": false,
								"chartType": "line"
							}
						},
						"groups": []
					},
					{
						"i": "open_interest_chart_total",
						"x": 0,
						"y": 12,
						"w": 40,
						"h": 15,
						"state": {
							"chartModel": {
								"modelType": "range",
								"chartType": "line",
								"chartOptions": {},
								"suppressChartRanges": true
							},
							"chartView": {
								"enabled": false,
								"chartType": "line"
							}
						},
						"groups": []
					},
					{
						"i": "open_interest_chart_breakdown",
						"x": 0,
						"y": 27,
						"w": 40,
						"h": 15,
						"state": {
							"chartModel": {
								"modelType": "range",
								"chartType": "line",
								"chartOptions": {},
								"suppressChartRanges": true
							},
							"chartView": {
								"enabled": true,
								"chartType": "line"
							}
						},
						"groups": []
					},
					{
						"i": "open_interest_protocols",
						"x": 0,
						"y": 42,
						"w": 40,
						"h": 20,
						"state": {
							"chartView": {
								"enabled": false,
								"chartType": "line"
							}
						},
						"groups": []
					}
				]
			},
			"website": {
				"id": "website",
				"name": "Website",
				"layout": [
					{
						"i": "iframe",
						"x": 0,
						"y": 2,
						"w": 40,
						"h": 33,
						"state": {
							"storage": {
								"html": "https://defillama.com"
							}
						},
						"groups": []
					}
				]
			}
		},
		"groups": []
	}
	]);
});

app.get("/widgets.json", (c) => {
	return c.json({
		// Search Widgets
		search_protocols: {
			name: "Search Protocols",
			description: "Search and filter DeFi protocols by name, category, or chain",
			source: "DefiLlama",
			endpoint: "/defillama/protocols",
			params: [
				{
					paramName: "search",
					description: "Search protocols by name",
					type: "text",
					value: "",
				},
			],
		},
		search_chains: {
			name: "Search Chains",
			description: "Search and filter blockchain networks by name or TVL",
			source: "DefiLlama",
			endpoint: "/defillama/chains",
			params: [
				{
					paramName: "search",
					description: "Search chains by name",
					type: "text",
					value: "",
				},
			],
		},
		search_stablecoins: {
			name: "Search Stablecoins",
			description: "Search and filter stablecoins by name or symbol",
			source: "DefiLlama",
			endpoint: "/defillama/stablecoins",
			params: [
				{
					paramName: "search",
					description: "Search stablecoins by name or symbol",
					type: "text",
					value: "",
				},
			],
		},
		search_dexs: {
			name: "Search DEXs",
			description: "Search and filter decentralized exchanges by name or chain",
			source: "DefiLlama",
			endpoint: "/defillama/dexs",
			params: [
				{
					paramName: "search",
					description: "Search DEXs by name",
					type: "text",
					value: "",
				},
			],
		},
		search_yields: {
			name: "Search Yield Pools",
			description: "Search and filter yield farming pools by project, chain, or APY",
			source: "DefiLlama",
			endpoint: "/defillama/yields/pools",
			params: [
				{
					paramName: "search",
					description: "Search pools by project or symbol",
					type: "text",
					value: "",
				},
			],
		},

		// TVL Widgets
		protocols_list: {
			name: "Protocols List",
			description: "List all DeFi protocols with their TVL and statistics",
			source: "DefiLlama",
			endpoint: "/defillama/protocols",
			params: [],
		},
		chains_list: {
			name: "Chains List",
			description: "List all chains with their total TVL",
			source: "DefiLlama",
			endpoint: "/defillama/chains",
			params: [],
		},
		chains_chart: {
			name: "Chains TVL Data",
			description: "Data showing TVL by chain",
			source: "DefiLlama",
			endpoint: "/defillama/charts/chains",
			params: [],
		},
		protocol_tvl: {
			name: "Protocol TVL History",
			description: "Historical TVL data for a specific protocol",
			source: "DefiLlama",
			endpoint: "/defillama/charts/protocol/:slug",
			params: [
				{
					paramName: "slug",
					description: "Protocol slug (e.g., 'aave', 'uniswap')",
					type: "text",
					value: "aave",
				},
			],
		},
		chain_history: {
			name: "Chain TVL History",
			description: "Historical TVL data for a specific chain",
			source: "DefiLlama",
			endpoint: "/defillama/chain/:chain",
			params: [
				{
					paramName: "chain",
					description: "Chain name (e.g., 'Ethereum', 'BSC', 'Polygon')",
					type: "text",
					value: "Ethereum",
				},
			],
		},
		categories_list: {
			name: "DeFi Categories",
			description: "List all protocol categories with TVL and protocol count",
			source: "DefiLlama",
			endpoint: "/defillama/categories",
			params: [],
		},

		// Stablecoin Widgets
		stablecoins_list: {
			name: "Stablecoins List",
			description: "List all stablecoins with circulating supply and market cap",
			source: "DefiLlama",
			endpoint: "/defillama/stablecoins",
			params: [],
		},
		stablecoin_history: {
			name: "Stablecoin History",
			description: "Historical market cap for a specific stablecoin",
			source: "DefiLlama",
			endpoint: "/defillama/stablecoin/:asset",
			params: [
				{
					paramName: "asset",
					description: "Stablecoin ID (e.g., '1' for USDT, '2' for USDC)",
					type: "text",
					value: "1",
				},
			],
		},
		stablecoins_by_chain: {
			name: "Stablecoins by Chain",
			description: "Stablecoin market cap distribution across chains",
			source: "DefiLlama",
			endpoint: "/defillama/stablecoins/chains",
			params: [],
		},
		stablecoins_chart: {
			name: "Stablecoins Market Cap Data",
			description: "Historical market cap data of all stablecoins",
			source: "DefiLlama",
			endpoint: "/defillama/charts/stablecoins",
			params: [],
		},

		// Yields/APY Widgets
		yields_pools: {
			name: "Yield Pools",
			description: "List all yield farming pools with APY data",
			source: "DefiLlama",
			endpoint: "/defillama/yields/pools",
			params: [],
		},
		yield_chart: {
			name: "Pool APY History",
			description: "Historical APY chart for a specific pool",
			source: "DefiLlama",
			endpoint: "/defillama/yields/chart/:pool",
			params: [
				{
					paramName: "pool",
					description: "Pool ID (UUID from yields_pools widget)",
					type: "text",
					value: "",
				},
			],
		},

		// DEX Volume Widgets
		dexs_list: {
			name: "DEX Volumes",
			description: "List all DEXs with volume statistics",
			source: "DefiLlama",
			endpoint: "/defillama/dexs",
			params: [],
		},
		dexs_by_chain: {
			name: "DEX Volumes by Chain",
			description: "DEX volumes filtered by blockchain",
			source: "DefiLlama",
			endpoint: "/defillama/dexs/:chain",
			params: [
				{
					paramName: "chain",
					description: "Chain name (e.g., 'Ethereum', 'BSC')",
					type: "text",
					value: "Ethereum",
				},
			],
		},
		dex_summary: {
			name: "DEX Volume Summary",
			description: "Detailed volume data for a specific DEX",
			source: "DefiLlama",
			endpoint: "/defillama/dexs/summary/:protocol",
			params: [
				{
					paramName: "protocol",
					description: "DEX protocol name (e.g., 'uniswap', 'pancakeswap')",
					type: "text",
					value: "uniswap",
				},
			],
		},
		dex_chart: {
			name: "DEX Volume History",
			description: "Historical volume data for a DEX",
			source: "DefiLlama",
			endpoint: "/defillama/charts/dex/:protocol",
			params: [
				{
					paramName: "protocol",
					description: "DEX protocol name (e.g., 'uniswap')",
					type: "text",
					value: "uniswap",
				},
			],
		},

		// Fees & Revenue Widgets
		fees_list: {
			name: "Protocol Fees & Revenue",
			description: "List all protocols with fees and revenue data",
			source: "DefiLlama",
			endpoint: "/defillama/fees",
			params: [],
		},
		fees_by_chain: {
			name: "Fees by Chain",
			description: "Protocol fees filtered by blockchain",
			source: "DefiLlama",
			endpoint: "/defillama/fees/:chain",
			params: [
				{
					paramName: "chain",
					description: "Chain name (e.g., 'Ethereum', 'Arbitrum')",
					type: "text",
					value: "Ethereum",
				},
			],
		},
		fees_summary: {
			name: "Protocol Fees Summary",
			description: "Detailed fees data for a specific protocol",
			source: "DefiLlama",
			endpoint: "/defillama/fees/summary/:protocol",
			params: [
				{
					paramName: "protocol",
					description: "Protocol name (e.g., 'uniswap', 'aave')",
					type: "text",
					value: "uniswap",
				},
			],
		},
		fees_chart: {
			name: "Protocol Fees History",
			description: "Historical fees data for a protocol",
			source: "DefiLlama",
			endpoint: "/defillama/charts/fees/:protocol",
			params: [
				{
					paramName: "protocol",
					description: "Protocol name (e.g., 'uniswap')",
					type: "text",
					value: "uniswap",
				},
			],
		},

		// Bridges Widgets
		bridges_list: {
			name: "Cross-Chain Bridges",
			description: "List all cross-chain bridges with volume data",
			source: "DefiLlama",
			endpoint: "/defillama/bridges",
			params: [],
		},
		bridge_details: {
			name: "Bridge Details",
			description: "Detailed information for a specific bridge",
			source: "DefiLlama",
			endpoint: "/defillama/bridge/:id",
			params: [
				{
					paramName: "id",
					description: "Bridge ID (numeric, e.g., '1' for Polygon Bridge)",
					type: "text",
					value: "1",
				},
			],
		},

		// Options/Derivatives Widgets
		options_list: {
			name: "Options Protocols",
			description: "List all options and derivatives protocols",
			source: "DefiLlama",
			endpoint: "/defillama/options",
			params: [],
		},
		options_by_chain: {
			name: "Options by Chain",
			description: "Options protocols filtered by blockchain",
			source: "DefiLlama",
			endpoint: "/defillama/options/:chain",
			params: [
				{
					paramName: "chain",
					description: "Chain name (e.g., 'Ethereum', 'Arbitrum')",
					type: "text",
					value: "Ethereum",
				},
			],
		},
		options_summary: {
			name: "Options Protocol Summary",
			description: "Detailed volume data for a specific options protocol",
			source: "DefiLlama",
			endpoint: "/defillama/options/summary/:protocol",
			params: [
				{
					paramName: "protocol",
					description: "Protocol name (e.g., 'dydx', 'lyra')",
					type: "text",
					value: "dydx",
				},
			],
		},

		// Global Charts
		global_tvl_chart: {
			name: "Global DeFi TVL Data",
			description: "Historical data of total DeFi TVL across all chains",
			source: "DefiLlama",
			endpoint: "/defillama/charts/global-tvl",
			params: [],
		},

		// Token Prices
		token_prices_current: {
			name: "Current Token Prices",
			description: "Get current prices for tokens by contract address",
			source: "DefiLlama",
			endpoint: "/defillama/prices/current/:coins",
			params: [
				{
					paramName: "coins",
					description: "Comma-separated list of coins in format 'chain:address' (e.g., 'ethereum:0x0000000000000000000000000000000000000000')",
					type: "text",
					value: "ethereum:0x0000000000000000000000000000000000000000",
				},
			],
		},
		token_prices_historical: {
			name: "Historical Token Prices",
			description: "Get historical prices for tokens at a specific timestamp",
			source: "DefiLlama",
			endpoint: "/defillama/prices/historical/:timestamp/:coins",
			params: [
				{
					paramName: "timestamp",
					description: "Unix timestamp (seconds)",
					type: "text",
					value: "1648680149",
				},
				{
					paramName: "coins",
					description: "Comma-separated list of coins in format 'chain:address'",
					type: "text",
					value: "ethereum:0x0000000000000000000000000000000000000000",
				},
			],
		},

		// Open Interest Widgets
		open_interest_stats: {
			name: "Open Interest Statistics",
			description: "Key metrics and statistics for open interest",
			source: "DefiLlama",
			endpoint: "/defillama/open-interest/stats",
			params: [],
		},
		open_interest_protocols: {
			name: "Open Interest Protocols",
			description: "List all protocols with open interest data",
			source: "DefiLlama",
			endpoint: "/defillama/open-interest/protocols",
			params: [
				{
					paramName: "search",
					description: "Search protocols by name",
					type: "text",
					value: "",
				},
			],
		},
		open_interest_chart_total: {
			name: "Open Interest Total Chart",
			description: "Historical total open interest data",
			source: "DefiLlama",
			endpoint: "/defillama/open-interest/chart/total",
			params: [],
		},
		open_interest_chart_breakdown: {
			name: "Open Interest Breakdown Chart",
			description: "Historical open interest breakdown by protocol",
			source: "DefiLlama",
			endpoint: "/defillama/open-interest/chart/breakdown",
			params: [],
		},
	});
});

app.route("/defillama", defillama);

export default app;
