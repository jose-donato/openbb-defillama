import { Hono } from "hono";

// Cache helper function using Cloudflare Cache API
const fetchWithCache = async (url: string, ttlSeconds = 300): Promise<any> => {
	const cache = caches.default;
	const cacheKey = new Request(url);

	// Try to get from cache first
	let response = await cache.match(cacheKey);

	if (!response) {
		// Cache miss - fetch from API
		response = await fetch(url);

		if (response.ok) {
			// Clone and cache the response
			const clonedResponse = response.clone();
			const headers = new Headers(clonedResponse.headers);
			headers.set("Cache-Control", `public, max-age=${ttlSeconds}`);
			const cachedResponse = new Response(clonedResponse.body, {
				status: clonedResponse.status,
				statusText: clonedResponse.statusText,
				headers,
			});
			// Don't await - cache in background
			cache.put(cacheKey, cachedResponse);
		}
	}

	if (!response.ok) {
		throw new Error(`Failed to fetch: ${response.statusText}`);
	}

	return response.json();
};

const formatNumber = (num: number | string | undefined | null): string => {
	if (num === undefined || num === null) {
		return "0";
	}
	const value = typeof num === "string" ? Number.parseFloat(num) : num;
	if (Number.isNaN(value)) {
		return "0";
	}
	return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
};

const formatDate = (timestamp: number): string => {
	const date = new Date(timestamp * 1000);
	if (Number.isNaN(date.getTime())) {
		return "Invalid date";
	}
	return date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
};

const defillama = new Hono();

type Protocol = {
	id: string;
	name: string;
	symbol: string;
	category: string;
	chains: string[];
	tvl: number;
	chainTvls: Record<string, number>;
	change_1d: number;
	change_7d: number;
	change_1m: number;
	mcap?: number;
	logo?: string;
	url?: string;
	description?: string;
	twitter?: string;
	audit_links?: string[];
	slug: string;
};

type ProtocolDetail = {
	id: string;
	name: string;
	symbol: string;
	category: string;
	chains: string[];
	tvl: number[];
	chainTvls: Record<string, { tvl: number[] }>;
	tokens: Record<string, { tvl: number[] }>;
	tokensInUsd: Array<{ date: number; tokens: Record<string, number> }>;
	mcap?: number;
	logo?: string;
	url?: string;
	description?: string;
	twitter?: string;
	slug: string;
};

type Chain = {
	gecko_id: string | null;
	tvl: number;
	tokenSymbol: string;
	cmcId: string | null;
	name: string;
	chainId: number | null;
};

// List all protocols with their TVL
defillama.get("/protocols", async (c) => {
	const { search } = c.req.query();

	try {
		// Cache for 30 minutes
		const data = (await fetchWithCache("https://api.llama.fi/protocols", 1800)) as Protocol[];

		// Filter by search term if provided
		const filteredData = search
			? data.filter((protocol) =>
				protocol.name.toLowerCase().includes(search.toLowerCase()) ||
				protocol.symbol?.toLowerCase().includes(search.toLowerCase()) ||
				protocol.category.toLowerCase().includes(search.toLowerCase())
			)
			: data;

		return c.json(
			filteredData.map((protocol) => ({
				id: protocol.id,
				name: protocol.name,
				symbol: protocol.symbol || "",
				category: protocol.category,
				chains: protocol.chains.join(", "),
				tvl: protocol.tvl,
				change_1d: protocol.change_1d || 0,
				change_7d: protocol.change_7d || 0,
				change_1m: protocol.change_1m || 0,
				mcap: protocol.mcap || 0,
				slug: protocol.slug,
			}))
		);
	} catch (error) {
		return c.json({ error: "Failed to fetch protocols" }, 500);
	}
});

// Get protocol details with historical TVL
defillama.get("/protocol/:slug", async (c) => {
	const { slug } = c.req.param();

	let protocol: any;
	try {
		// Cache for 30 minutes
		protocol = await fetchWithCache(`https://api.llama.fi/protocol/${slug}`, 1800);
	} catch (error) {
		return c.json({ error: "Protocol not found" }, 404);
	}

	return c.json({
		id: protocol.id,
		name: protocol.name,
		symbol: protocol.symbol || "",
		category: protocol.category,
		chains: protocol.chains,
		description: protocol.description || "",
		logo: protocol.logo || "",
		url: protocol.url || "",
		twitter: protocol.twitter || "",
		tvl: protocol.tvl,
		chainTvls: protocol.chainTvls || {},
		mcap: protocol.mcap || 0,
		slug: protocol.slug,
	});
});

// Get historical TVL for a protocol
defillama.get("/protocol/:slug/tvl", async (c) => {
	const { slug } = c.req.param();

	let protocol: any;
	try {
		// Cache for 1 hour - historical data
		protocol = await fetchWithCache(`https://api.llama.fi/protocol/${slug}`, 3600);
	} catch (error) {
		return c.json({ error: "Protocol not found" }, 404);
	}

	// Transform TVL array into time series
	const tvlData = protocol.tvl?.map((point: any) => ({
		date: formatDate(point.date),
		totalLiquidityUSD: point.totalLiquidityUSD,
	})) || [];

	return c.json(tvlData);
});

// Get all chains with their TVL
defillama.get("/chains", async (c) => {
	const { search } = c.req.query();

	try {
		// Cache for 30 minutes
		const data = (await fetchWithCache("https://api.llama.fi/v2/chains", 1800)) as Chain[];

		// Filter by search term if provided
		const filteredData = search
			? data.filter((chain) =>
				chain.name.toLowerCase().includes(search.toLowerCase()) ||
				chain.tokenSymbol?.toLowerCase().includes(search.toLowerCase())
			)
			: data;

		return c.json(
			filteredData.map((chain) => ({
				name: chain.name,
				tvl: chain.tvl,
				tokenSymbol: chain.tokenSymbol || "",
				chainId: chain.chainId || "",
			}))
		);
	} catch (error) {
		return c.json({ error: "Failed to fetch chains" }, 500);
	}
});

// Get historical TVL for a specific chain
defillama.get("/chain/:chain", async (c) => {
	const { chain } = c.req.param();

	let data: Array<{ date: number; tvl: number }>;
	try {
		// Cache for 1 hour - historical data
		data = await fetchWithCache(`https://api.llama.fi/v2/historicalChainTvl/${chain}`, 3600);
	} catch (error) {
		return c.json({ error: "Chain not found" }, 404);
	}

	return c.json(
		data.map((point) => ({
			date: formatDate(point.date),
			tvl: point.tvl,
		}))
	);
});

// Get current TVL across all chains (for chart)
defillama.get("/charts/chains", async (c) => {
	try {
		// Cache for 30 minutes
		const data = (await fetchWithCache("https://api.llama.fi/v2/chains", 1800)) as Chain[];

		// Sort by TVL descending
		const sortedChains = data.sort((a, b) => b.tvl - a.tvl).slice(0, 20);

		return c.json(
			sortedChains.map((chain) => ({
				name: chain.name,
				value: chain.tvl,
				tokenSymbol: chain.tokenSymbol || "",
				chainId: chain.chainId || "",
			}))
		);
	} catch (error) {
		return c.json({ error: "Failed to fetch chains" }, 500);
	}
});

// Get historical TVL chart for a protocol
defillama.get("/charts/protocol/:slug", async (c) => {
	const { slug } = c.req.param();

	let protocol: any;
	try {
		// Cache for 1 hour - historical data
		protocol = await fetchWithCache(`https://api.llama.fi/protocol/${slug}`, 3600);
	} catch (error) {
		return c.json({ error: "Protocol not found" }, 404);
	}

	return c.json(
		protocol.tvl?.map((point: any) => ({
			date: new Date(point.date * 1000).toISOString().split("T")[0],
			value: point.totalLiquidityUSD,
		})) || []
	);
});

// ============================================
// STABLECOINS ENDPOINTS
// ============================================

// List all stablecoins with their circulating amounts
defillama.get("/stablecoins", async (c) => {
	const { search } = c.req.query();

	try {
		// Cache for 30 minutes
		const data = await fetchWithCache("https://stablecoins.llama.fi/stablecoins?includePrices=true", 1800);

		// Filter by search term if provided
		const filteredAssets = search
			? data.peggedAssets.filter((stablecoin: any) =>
				stablecoin.name.toLowerCase().includes(search.toLowerCase()) ||
				stablecoin.symbol.toLowerCase().includes(search.toLowerCase())
			)
			: data.peggedAssets;

		return c.json(
			filteredAssets.map((stablecoin: any) => ({
				id: stablecoin.id,
				name: stablecoin.name,
				symbol: stablecoin.symbol,
				circulating: stablecoin.circulating?.peggedUSD || 0,
				price: stablecoin.price || 1,
				chains: stablecoin.chainCirculating
					? Object.keys(stablecoin.chainCirculating).join(", ")
					: "",
				change_1d: stablecoin.circulatingPrevDay?.peggedUSD
					? ((stablecoin.circulating?.peggedUSD - stablecoin.circulatingPrevDay?.peggedUSD) / stablecoin.circulatingPrevDay?.peggedUSD) * 100
					: 0,
				change_7d: stablecoin.circulatingPrevWeek?.peggedUSD
					? ((stablecoin.circulating?.peggedUSD - stablecoin.circulatingPrevWeek?.peggedUSD) / stablecoin.circulatingPrevWeek?.peggedUSD) * 100
					: 0,
				change_1m: stablecoin.circulatingPrevMonth?.peggedUSD
					? ((stablecoin.circulating?.peggedUSD - stablecoin.circulatingPrevMonth?.peggedUSD) / stablecoin.circulatingPrevMonth?.peggedUSD) * 100
					: 0,
			}))
		);
	} catch (error) {
		return c.json({ error: "Failed to fetch stablecoins" }, 500);
	}
});

// Get historical market cap for a specific stablecoin
defillama.get("/stablecoin/:asset", async (c) => {
	const { asset } = c.req.param();

	try {
		// Cache for 1 hour - historical data
		const data = await fetchWithCache(`https://stablecoins.llama.fi/stablecoin/${asset}`, 3600);

		return c.json(
			data.chainBalances?.map((point: any) => ({
				date: formatDate(point.date),
				totalCirculating: point.totalCirculating?.peggedUSD || 0,
				...point.tokens,
			})) || []
		);
	} catch (error) {
		return c.json({ error: "Stablecoin not found" }, 404);
	}
});

// Get stablecoin market cap by chain
defillama.get("/stablecoins/chains", async (c) => {
	try {
		// Cache for 30 minutes
		const data = await fetchWithCache("https://stablecoins.llama.fi/stablecoinchains", 1800);

		return c.json(
			data.map((chain: any) => ({
				gecko_id: chain.gecko_id,
				totalCirculatingUSD: chain.totalCirculatingUSD?.peggedUSD || 0,
				name: chain.name,
			}))
		);
	} catch (error) {
		return c.json({ error: "Failed to fetch stablecoin chains" }, 500);
	}
});

// Get historical stablecoin market cap across all chains
defillama.get("/stablecoins/charts/all", async (c) => {
	try {
		// Cache for 1 hour - historical data
		const data = await fetchWithCache("https://stablecoins.llama.fi/stablecoincharts/all", 3600);

		return c.json(
			data.map((point: any) => ({
				date: point.date,
				totalCirculatingUSD: point.totalCirculatingUSD?.peggedUSD || 0,
			}))
		);
	} catch (error) {
		return c.json({ error: "Failed to fetch stablecoin charts" }, 500);
	}
});

// ============================================
// YIELDS / APY ENDPOINTS
// ============================================

// Get all yield pools with APY data
defillama.get("/yields/pools", async (c) => {
	const { search } = c.req.query();

	try {
		// Cache for 30 minutes
		const data = await fetchWithCache("https://yields.llama.fi/pools", 1800);

		// Filter by search term if provided
		const filteredPools = search
			? data.data.filter((pool: any) =>
				pool.project?.toLowerCase().includes(search.toLowerCase()) ||
				pool.symbol?.toLowerCase().includes(search.toLowerCase()) ||
				pool.chain?.toLowerCase().includes(search.toLowerCase())
			)
			: data.data;

		return c.json(
			filteredPools.map((pool: any) => ({
				pool: pool.pool,
				chain: pool.chain,
				project: pool.project,
				symbol: pool.symbol,
				tvlUsd: pool.tvlUsd || 0,
				apy: pool.apy || 0,
				apyBase: pool.apyBase || 0,
				apyReward: pool.apyReward || 0,
				apyPct1D: pool.apyPct1D || 0,
				apyPct7D: pool.apyPct7D || 0,
				apyPct30D: pool.apyPct30D || 0,
				stablecoin: pool.stablecoin || false,
				ilRisk: pool.ilRisk || "no",
				exposure: pool.exposure || "",
				predictions: pool.predictions || {},
			}))
		);
	} catch (error) {
		return c.json({ error: "Failed to fetch yield pools" }, 500);
	}
});

// Get historical APY for a specific pool
defillama.get("/yields/chart/:pool", async (c) => {
	const { pool } = c.req.param();

	try {
		// Cache for 1 hour - historical data
		const data = await fetchWithCache(`https://yields.llama.fi/chart/${pool}`, 3600);

		return c.json({
			status: data.status,
			data: data.data.map((point: any) => ({
				date: new Date(point.timestamp).toISOString(),
				tvlUsd: point.tvlUsd || 0,
				apy: point.apy || 0,
				apyBase: point.apyBase || 0,
				apyReward: point.apyReward || 0,
			})),
		});
	} catch (error) {
		return c.json({ error: "Pool not found" }, 404);
	}
});

// ============================================
// DEX VOLUME ENDPOINTS
// ============================================

// List all DEXs with volume summaries
defillama.get("/dexs", async (c) => {
	const { search } = c.req.query();

	try {
		// Cache for 30 minutes
		const data = await fetchWithCache("https://api.llama.fi/overview/dexs", 1800);

		// Filter by search term if provided
		const filteredProtocols = search
			? data.protocols.filter((dex: any) =>
				dex.name.toLowerCase().includes(search.toLowerCase()) ||
				dex.displayName?.toLowerCase().includes(search.toLowerCase())
			)
			: data.protocols;

		return c.json(
			filteredProtocols.map((dex: any) => ({
				defillamaId: dex.defillamaId,
				name: dex.name,
				displayName: dex.displayName,
				module: dex.module,
				category: dex.category,
				logo: dex.logo,
				chains: dex.chains || [],
				total24h: dex.total24h || 0,
				total7d: dex.total7d || 0,
				total30d: dex.total30d || 0,
				totalAllTime: dex.totalAllTime || 0,
				change_1d: dex.change_1d || 0,
				change_7d: dex.change_7d || 0,
				change_1m: dex.change_1m || 0,
			}))
		);
	} catch (error) {
		return c.json({ error: "Failed to fetch DEXs" }, 500);
	}
});

// Get DEX volume by chain
defillama.get("/dexs/:chain", async (c) => {
	const { chain } = c.req.param();

	try {
		// Cache for 30 minutes
		const data = await fetchWithCache(`https://api.llama.fi/overview/dexs/${chain}`, 1800);

		return c.json(
			data.protocols.map((dex: any) => ({
				defillamaId: dex.defillamaId,
				name: dex.name,
				displayName: dex.displayName,
				total24h: dex.total24h || 0,
				total7d: dex.total7d || 0,
				change_1d: dex.change_1d || 0,
				change_7d: dex.change_7d || 0,
			}))
		);
	} catch (error) {
		return c.json({ error: "Failed to fetch DEX data for chain" }, 500);
	}
});

// Get historical volume for a specific DEX
defillama.get("/dexs/summary/:protocol", async (c) => {
	const { protocol } = c.req.param();

	try {
		// Cache for 1 hour - historical data
		const data = await fetchWithCache(`https://api.llama.fi/summary/dexs/${protocol}`, 3600);

		return c.json({
			name: data.name,
			displayName: data.displayName,
			total24h: data.total24h,
			total7d: data.total7d,
			total30d: data.total30d,
			totalAllTime: data.totalAllTime,
			totalDataChart: data.totalDataChart?.map((point: any) => ({
				date: new Date(point[0] * 1000).toISOString(),
				volume: point[1],
			})) || [],
			totalDataChartBreakdown: data.totalDataChartBreakdown || [],
		});
	} catch (error) {
		return c.json({ error: "DEX not found" }, 404);
	}
});

// ============================================
// FEES AND REVENUE ENDPOINTS
// ============================================

// List all protocols with fees and revenue
defillama.get("/fees", async (c) => {
	try {
		// Cache for 30 minutes
		const data = await fetchWithCache("https://api.llama.fi/overview/fees", 1800);

		return c.json(
			data.protocols.map((protocol: any) => ({
				displayName: protocol.displayName,
				category: protocol.category,
				definition: protocol.methodology?.Revenue ?? "",
				chains: protocol.chains || [],
				revenue24h: protocol.total24h || 0,
				revenue7d: protocol.total7d || 0,
				revenue30d: protocol.total30d || 0,
				revenueAllTime: protocol.totalAllTime || 0,
				monthlyAverage: protocol.monthlyAverage1y || 0,
				change_1d: protocol.change_1d || 0,
				change_7d: protocol.change_7d || 0,
				change_1m: protocol.change_1m || 0,
			}))
		);
	} catch (error) {
		return c.json({ error: "Failed to fetch fees data" }, 500);
	}
});

// Get fees by chain
defillama.get("/fees/:chain", async (c) => {
	const { chain } = c.req.param();

	try {
		// Cache for 30 minutes
		const data = await fetchWithCache(`https://api.llama.fi/overview/fees/${chain}`, 1800);

		return c.json(
			data.protocols.map((protocol: any) => ({
				defillamaId: protocol.defillamaId,
				name: protocol.name,
				displayName: protocol.displayName,
				total24h: protocol.total24h || 0,
				total7d: protocol.total7d || 0,
				revenue24h: protocol.revenue24h || 0,
				revenue7d: protocol.revenue7d || 0,
				change_1d: protocol.change_1d || 0,
				change_7d: protocol.change_7d || 0,
			}))
		);
	} catch (error) {
		return c.json({ error: "Failed to fetch fees for chain" }, 500);
	}
});

// Get historical fees for a specific protocol
defillama.get("/fees/summary/:protocol", async (c) => {
	const { protocol } = c.req.param();

	try {
		// Cache for 1 hour - historical data
		const data = await fetchWithCache(`https://api.llama.fi/summary/fees/${protocol}`, 3600);

		return c.json({
			name: data.name,
			displayName: data.displayName,
			total24h: data.total24h,
			total7d: data.total7d,
			total30d: data.total30d,
			totalAllTime: data.totalAllTime,
			totalDataChart: data.totalDataChart?.map((point: any) => ({
				date: new Date(point[0] * 1000).toISOString(),
				fees: point[1],
			})) || [],
			totalDataChartBreakdown: data.totalDataChartBreakdown || [],
		});
	} catch (error) {
		return c.json({ error: "Protocol not found" }, 404);
	}
});

// ============================================
// CATEGORIES & OVERVIEW ENDPOINTS
// ============================================

// Get all protocol categories
defillama.get("/categories", async (c) => {
	try {
		// Cache for 1 hour - categories change infrequently
		const data = await fetchWithCache("https://api.llama.fi/api/categories", 3600);

		return c.json(
			data.map((category: any) => ({
				name: category.name,
				tvl: category.tvl || 0,
				change_1d: category.change_1d || 0,
				change_7d: category.change_7d || 0,
				mcapTvl: category.mcapTvl || 0,
				protocols: category.protocols || 0,
				description: category.description || "",
			}))
		);
	} catch (error) {
		return c.json({ error: "Failed to fetch categories" }, 500);
	}
});

// ============================================
// CHARTS FOR VISUALIZATION
// ============================================

// Stablecoins market cap chart
defillama.get("/charts/stablecoins", async (c) => {
	try {
		// Cache for 1 hour - historical data
		const data = await fetchWithCache("https://stablecoins.llama.fi/stablecoincharts/all", 3600);

		return c.json(
			data.map((point: any) => ({
				date: new Date(point.date * 1000).toISOString().split("T")[0],
				value: point.totalCirculatingUSD?.peggedUSD || 0,
			}))
		);
	} catch (error) {
		return c.json({ error: "Failed to fetch stablecoin data" }, 500);
	}
});

// DEX volume chart for a specific protocol
defillama.get("/charts/dex/:protocol", async (c) => {
	const { protocol } = c.req.param();

	try {
		// Cache for 1 hour - historical data
		const data = await fetchWithCache(`https://api.llama.fi/summary/dexs/${protocol}`, 3600);

		return c.json(
			data.totalDataChart?.map((point: any) => ({
				date: new Date(point[0] * 1000).toISOString().split("T")[0],
				value: point[1],
			})) || []
		);
	} catch (error) {
		return c.json({ error: "DEX not found" }, 404);
	}
});

// Fees chart for a specific protocol
defillama.get("/charts/fees/:protocol", async (c) => {
	const { protocol } = c.req.param();

	try {
		// Cache for 1 hour - historical data
		const data = await fetchWithCache(`https://api.llama.fi/summary/fees/${protocol}`, 3600);

		return c.json(
			data.totalDataChart?.map((point: any) => ({
				date: new Date(point[0] * 1000).toISOString().split("T")[0],
				value: point[1],
			})) || []
		);
	} catch (error) {
		return c.json({ error: "Protocol not found" }, 404);
	}
});

// ============================================
// BRIDGES ENDPOINTS
// ============================================

// List all bridges with volume data
defillama.get("/bridges", async (c) => {
	try {
		// Cache for 30 minutes
		const data = await fetchWithCache("https://bridges.llama.fi/bridges?includeChains=true", 1800);

		return c.json(
			data.bridges.map((bridge: any) => ({
				displayName: bridge.displayName,
				volumePrevDay: bridge.volumePrevDay || 0,
				volumePrev2Day: bridge.volumePrev2Day || 0,
				weeklyVolume: bridge.weeklyVolume || 0,
				monthlyVolume: bridge.monthlyVolume || 0,
				chains: bridge.chains || [],
				destinationChain: bridge.destinationChain || "",
			}))
		);
	} catch (error) {
		return c.json({ error: "Failed to fetch bridges" }, 500);
	}
});

// Get bridge details by ID
defillama.get("/bridge/:id", async (c) => {
	const { id } = c.req.param();

	try {
		// Cache for 30 minutes
		const data = await fetchWithCache(`https://bridges.llama.fi/bridge/${id}`, 1800);
		return c.json(data);
	} catch (error) {
		return c.json({ error: "Bridge not found" }, 404);
	}
});

// ============================================
// OPTIONS/DERIVATIVES ENDPOINTS
// ============================================

// List all options DEXs
defillama.get("/options", async (c) => {
	try {
		// Cache for 30 minutes
		const data = await fetchWithCache("https://api.llama.fi/overview/options", 1800);

		return c.json(
			data.protocols.map((protocol: any) => ({
				defillamaId: protocol.defillamaId,
				name: protocol.name,
				displayName: protocol.displayName,
				module: protocol.module,
				category: protocol.category,
				logo: protocol.logo,
				chains: protocol.chains || [],
				total24h: protocol.total24h || 0,
				total7d: protocol.total7d || 0,
				total30d: protocol.total30d || 0,
				totalAllTime: protocol.totalAllTime || 0,
				change_1d: protocol.change_1d || 0,
				change_7d: protocol.change_7d || 0,
				change_1m: protocol.change_1m || 0,
			}))
		);
	} catch (error) {
		return c.json({ error: "Failed to fetch options data" }, 500);
	}
});

// Get options by chain
defillama.get("/options/:chain", async (c) => {
	const { chain } = c.req.param();

	try {
		// Cache for 30 minutes
		const data = await fetchWithCache(`https://api.llama.fi/overview/options/${chain}`, 1800);

		return c.json(
			data.protocols.map((protocol: any) => ({
				defillamaId: protocol.defillamaId,
				name: protocol.name,
				displayName: protocol.displayName,
				total24h: protocol.total24h || 0,
				total7d: protocol.total7d || 0,
				change_1d: protocol.change_1d || 0,
				change_7d: protocol.change_7d || 0,
			}))
		);
	} catch (error) {
		return c.json({ error: "Failed to fetch options for chain" }, 500);
	}
});

// Get options summary for a protocol
defillama.get("/options/summary/:protocol", async (c) => {
	const { protocol } = c.req.param();

	try {
		// Cache for 1 hour - historical data
		const data = await fetchWithCache(`https://api.llama.fi/summary/options/${protocol}`, 3600);

		return c.json({
			name: data.name,
			displayName: data.displayName,
			total24h: data.total24h,
			total7d: data.total7d,
			total30d: data.total30d,
			totalAllTime: data.totalAllTime,
			totalDataChart: data.totalDataChart?.map((point: any) => ({
				date: new Date(point[0] * 1000).toISOString(),
				volume: point[1],
			})) || [],
		});
	} catch (error) {
		return c.json({ error: "Protocol not found" }, 404);
	}
});

// ============================================
// OPEN INTEREST ENDPOINTS
// ============================================

// Get open interest overview and statistics
defillama.get("/open-interest", async (c) => {
	try {
		// Cache for 30 minutes
		const data = await fetchWithCache("https://api.llama.fi/overview/open-interest", 1800);
		return c.json(data);
	} catch (error) {
		return c.json({ error: "Failed to fetch open interest data" }, 500);
	}
});

// Get open interest protocols table
defillama.get("/open-interest/protocols", async (c) => {
	const { search } = c.req.query();

	try {
		// Cache for 30 minutes
		const data = await fetchWithCache("https://api.llama.fi/overview/open-interest", 1800);

		const filteredProtocols = search
			? data.protocols.filter((protocol: any) =>
				protocol.name.toLowerCase().includes(search.toLowerCase()) ||
				protocol.displayName?.toLowerCase().includes(search.toLowerCase())
			)
			: data.protocols;

		return c.json(
			filteredProtocols.map((protocol: any) => ({
				name: protocol.name,
				displayName: protocol.displayName,
				total24h: protocol.total24h || 0,
				total7d: protocol.total7d || 0,
				change_1d: protocol.change_1d || 0,
				change_7d: protocol.change_7d || 0,
				chains: protocol.chains?.join(", ") || "",
			}))
		);
	} catch (error) {
		return c.json({ error: "Failed to fetch open interest protocols" }, 500);
	}
});

// Get open interest total data chart
defillama.get("/open-interest/chart/total", async (c) => {
	try {
		// Cache for 1 hour - historical data
		const data = await fetchWithCache("https://api.llama.fi/overview/open-interest", 3600);

		return c.json(
			data.totalDataChart?.map((point: any) => ({
				date: new Date(point[0] * 1000).toISOString().split("T")[0],
				value: point[1],
			})) || []
		);
	} catch (error) {
		return c.json({ error: "Failed to fetch open interest chart data" }, 500);
	}
});

// Get open interest breakdown chart data
defillama.get("/open-interest/chart/breakdown", async (c) => {
	try {
		// Cache for 1 hour - historical data
		const data = await fetchWithCache("https://api.llama.fi/overview/open-interest", 3600);

		if (!data.totalDataChartBreakdown || data.totalDataChartBreakdown.length === 0) {
			return c.json([]);
		}

		// Collect all unique protocol names across all timestamps
		const allProtocols = new Set<string>();
		for (const point of data.totalDataChartBreakdown) {
			if (point[1]) {
				Object.keys(point[1]).forEach((protocol) => allProtocols.add(protocol));
			}
		}

		// Normalize data: fill missing protocols with 0
		return c.json(
			data.totalDataChartBreakdown.map((point: any) => {
				const normalized: Record<string, string | number> = {
					date: new Date(point[0] * 1000).toISOString().split("T")[0],
				};

				// Initialize all protocols with 0
				allProtocols.forEach((protocol) => {
					normalized[protocol] = 0;
				});

				// Fill in actual values
				if (point[1]) {
					Object.entries(point[1]).forEach(([protocol, value]) => {
						normalized[protocol] = value as number;
					});
				}

				return normalized;
			})
		);
	} catch (error) {
		return c.json({ error: "Failed to fetch open interest breakdown" }, 500);
	}
});

// Get open interest stats
defillama.get("/open-interest/stats", async (c) => {
	try {
		// Cache for 30 minutes
		const data = await fetchWithCache("https://api.llama.fi/overview/open-interest", 1800);

		const latestTotal = data.totalDataChart?.[data.totalDataChart.length - 1]?.[1] || 0;
		const previousTotal = data.totalDataChart?.[data.totalDataChart.length - 2]?.[1] || 0;
		const weekAgoTotal = data.totalDataChart?.[data.totalDataChart.length - 8]?.[1] || 0;

		const change24h = previousTotal ? ((latestTotal - previousTotal) / previousTotal) * 100 : 0;
		const change7d = weekAgoTotal ? ((latestTotal - weekAgoTotal) / weekAgoTotal) * 100 : 0;

		return c.json([
			{
				metric: "Total Open Interest",
				value: latestTotal,
			},
			{
				metric: "24h Change",
				value: change24h,
			},
			{
				metric: "7d Change",
				value: change7d,
			},
			{
				metric: "Total Protocols",
				value: data.protocols?.length || 0,
			},
			{
				metric: "Total Chains",
				value: data.allChains?.length || 0,
			},
		]);
	} catch (error) {
		return c.json({ error: "Failed to fetch open interest stats" }, 500);
	}
});

// ============================================
// ADDITIONAL USEFUL ENDPOINTS
// ============================================

// Get global DeFi TVL historical data
defillama.get("/charts/global-tvl", async (c) => {
	try {
		// Cache for 1 hour - historical data
		const data = await fetchWithCache("https://api.llama.fi/v2/historicalChainTvl", 3600);

		return c.json(
			data.map((point: any) => ({
				date: new Date(point.date * 1000).toISOString().split("T")[0],
				value: point.tvl,
			}))
		);
	} catch (error) {
		return c.json({ error: "Failed to fetch global TVL" }, 500);
	}
});

// Get current token prices
defillama.get("/prices/current/:coins", async (c) => {
	const { coins } = c.req.param();

	try {
		// Cache for 5 minutes - current prices should be relatively fresh
		const data = await fetchWithCache(`https://coins.llama.fi/prices/current/${coins}`, 300);
		return c.json(data);
	} catch (error) {
		return c.json({ error: "Failed to fetch prices" }, 500);
	}
});

// Get historical token prices
defillama.get("/prices/historical/:timestamp/:coins", async (c) => {
	const { timestamp, coins } = c.req.param();

	try {
		// Cache for 1 hour - historical prices are immutable
		const data = await fetchWithCache(`https://coins.llama.fi/prices/historical/${timestamp}/${coins}`, 3600);
		return c.json(data);
	} catch (error) {
		return c.json({ error: "Failed to fetch historical prices" }, 500);
	}
});

export default defillama;
