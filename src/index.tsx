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
		allowedHeaders: ["Content-Type", "Authorization"],
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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
						const url = 'https://openbb-defillama.YOUR-DOMAIN.workers.dev';
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
							<img src="https://defillama.com/llama.png" alt="DefiLlama" class="h-20 w-auto" />
						</div>

						<div class="text-center space-y-4 mb-8">
							<h1 class="text-3xl font-bold tracking-tight text-white sm:text-4xl">
								DefiLlama App for OpenBB Workspace
							</h1>
						</div>

						<p class="text-sm text-gray-300 text-center mb-6">DeFi TVL and analytics dashboard</p>

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
												<code class="ml-1 bg-gray-700 text-gray-200 px-1 py-0.5 rounded">https://openbb-defillama.YOUR-DOMAIN.workers.dev</code>
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
							<a href="https://api-docs.defillama.com/" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl">
								API Documentation
							</a>
							<a href="https://github.com/YOUR-USERNAME/openbb-defillama" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200 shadow-lg hover:shadow-xl">
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
		"img": "https://defillama.com/llama.png",
		"img_dark": "https://defillama.com/llama.png",
		"img_light": "https://defillama.com/llama.png",
		"description": "An OpenBB Workspace app that connects to the DefiLlama API, enabling the integration of DeFi TVL data and analytics. It defines widgets for visualizing protocol TVL, chain analytics, and historical DeFi metrics within the OpenBB Workspace interface.",
		"allowCustomization": true,
		"tabs": {
			"overview": {
				"id": "overview",
				"name": "Overview",
				"layout": [
					{
						"i": "protocols_list",
						"x": 0,
						"y": 0,
						"w": 40,
						"h": 20,
						"state": {
							"chartView": {
								"enabled": false,
								"chartType": "line"
							}
						}
					},
					{
						"i": "chains_list",
						"x": 0,
						"y": 20,
						"w": 40,
						"h": 12,
						"state": {
							"chartView": {
								"enabled": false,
								"chartType": "line"
							}
						}
					},
					{
						"i": "chains_chart",
						"x": 0,
						"y": 32,
						"w": 40,
						"h": 15,
						"state": {
							"chartView": {
								"enabled": true,
								"chartType": "bar"
							}
						}
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
			name: "Chains TVL Chart",
			description: "Bar chart showing TVL by chain",
			source: "DefiLlama",
			endpoint: "/defillama/charts/chains",
			type: "chart",
			params: [],
		},
		protocol_tvl: {
			name: "Protocol TVL History",
			description: "Historical TVL chart for a specific protocol",
			source: "DefiLlama",
			endpoint: "/defillama/charts/protocol/:slug",
			type: "chart",
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
	});
});

app.route("/defillama", defillama);

export default app;
