import { Hono } from "hono";

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

	const response = await fetch("https://api.llama.fi/protocols");

	if (!response.ok) {
		return c.json({ error: "Failed to fetch protocols" }, 500);
	}

	const data = (await response.json()) as Protocol[];

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
});

// Get protocol details with historical TVL
defillama.get("/protocol/:slug", async (c) => {
	const { slug } = c.req.param();

	const response = await fetch(`https://api.llama.fi/protocol/${slug}`);

	if (!response.ok) {
		return c.json({ error: "Protocol not found" }, 404);
	}

	const protocol = (await response.json()) as any;

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

	const response = await fetch(`https://api.llama.fi/protocol/${slug}`);

	if (!response.ok) {
		return c.json({ error: "Protocol not found" }, 404);
	}

	const protocol = (await response.json()) as any;

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

	const response = await fetch("https://api.llama.fi/v2/chains");

	if (!response.ok) {
		return c.json({ error: "Failed to fetch chains" }, 500);
	}

	const data = (await response.json()) as Chain[];

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
});

// Get historical TVL for a specific chain
defillama.get("/chain/:chain", async (c) => {
	const { chain } = c.req.param();

	const response = await fetch(`https://api.llama.fi/v2/historicalChainTvl/${chain}`);

	if (!response.ok) {
		return c.json({ error: "Chain not found" }, 404);
	}

	const data = (await response.json()) as Array<{ date: number; tvl: number }>;

	return c.json(
		data.map((point) => ({
			date: formatDate(point.date),
			tvl: point.tvl,
		}))
	);
});

// Get current TVL across all chains (for chart)
defillama.get("/charts/chains", async (c) => {
	const response = await fetch("https://api.llama.fi/v2/chains");

	if (!response.ok) {
		return c.json({ error: "Failed to fetch chains" }, 500);
	}

	const data = (await response.json()) as Chain[];

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
});

// Get historical TVL chart for a protocol
defillama.get("/charts/protocol/:slug", async (c) => {
	const { slug } = c.req.param();

	const response = await fetch(`https://api.llama.fi/protocol/${slug}`);

	if (!response.ok) {
		return c.json({ error: "Protocol not found" }, 404);
	}

	const protocol = (await response.json()) as any;

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

	const response = await fetch("https://stablecoins.llama.fi/stablecoins?includePrices=true");

	if (!response.ok) {
		return c.json({ error: "Failed to fetch stablecoins" }, 500);
	}

	const data = (await response.json()) as any;

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
});

// Get historical market cap for a specific stablecoin
defillama.get("/stablecoin/:asset", async (c) => {
	const { asset } = c.req.param();

	const response = await fetch(`https://stablecoins.llama.fi/stablecoin/${asset}`);

	if (!response.ok) {
		return c.json({ error: "Stablecoin not found" }, 404);
	}

	const data = (await response.json()) as any;

	return c.json(
		data.chainBalances?.map((point: any) => ({
			date: formatDate(point.date),
			totalCirculating: point.totalCirculating?.peggedUSD || 0,
			...point.tokens,
		})) || []
	);
});

// Get stablecoin market cap by chain
defillama.get("/stablecoins/chains", async (c) => {
	const response = await fetch("https://stablecoins.llama.fi/stablecoinchains");

	if (!response.ok) {
		return c.json({ error: "Failed to fetch stablecoin chains" }, 500);
	}

	const data = (await response.json()) as any[];

	return c.json(
		data.map((chain) => ({
			gecko_id: chain.gecko_id,
			totalCirculatingUSD: chain.totalCirculatingUSD?.peggedUSD || 0,
			name: chain.name,
		}))
	);
});

// Get historical stablecoin market cap across all chains
defillama.get("/stablecoins/charts/all", async (c) => {
	const response = await fetch("https://stablecoins.llama.fi/stablecoincharts/all");

	if (!response.ok) {
		return c.json({ error: "Failed to fetch stablecoin charts" }, 500);
	}

	const data = (await response.json()) as Array<{ date: string; totalCirculatingUSD: any }>;

	return c.json(
		data.map((point) => ({
			date: point.date,
			totalCirculatingUSD: point.totalCirculatingUSD?.peggedUSD || 0,
		}))
	);
});

// ============================================
// YIELDS / APY ENDPOINTS
// ============================================

// Get all yield pools with APY data
defillama.get("/yields/pools", async (c) => {
	const { search } = c.req.query();

	const response = await fetch("https://yields.llama.fi/pools");

	if (!response.ok) {
		return c.json({ error: "Failed to fetch yield pools" }, 500);
	}

	const data = (await response.json()) as any;

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
});

// Get historical APY for a specific pool
defillama.get("/yields/chart/:pool", async (c) => {
	const { pool } = c.req.param();

	const response = await fetch(`https://yields.llama.fi/chart/${pool}`);

	if (!response.ok) {
		return c.json({ error: "Pool not found" }, 404);
	}

	const data = (await response.json()) as any;

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
});

// ============================================
// DEX VOLUME ENDPOINTS
// ============================================

// List all DEXs with volume summaries
defillama.get("/dexs", async (c) => {
	const { search } = c.req.query();

	const response = await fetch("https://api.llama.fi/overview/dexs");

	if (!response.ok) {
		return c.json({ error: "Failed to fetch DEXs" }, 500);
	}

	const data = (await response.json()) as any;

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
});

// Get DEX volume by chain
defillama.get("/dexs/:chain", async (c) => {
	const { chain } = c.req.param();

	const response = await fetch(`https://api.llama.fi/overview/dexs/${chain}`);

	if (!response.ok) {
		return c.json({ error: "Failed to fetch DEX data for chain" }, 500);
	}

	const data = (await response.json()) as any;

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
});

// Get historical volume for a specific DEX
defillama.get("/dexs/summary/:protocol", async (c) => {
	const { protocol } = c.req.param();

	const response = await fetch(`https://api.llama.fi/summary/dexs/${protocol}`);

	if (!response.ok) {
		return c.json({ error: "DEX not found" }, 404);
	}

	const data = (await response.json()) as any;

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
});

// ============================================
// FEES AND REVENUE ENDPOINTS
// ============================================

// List all protocols with fees and revenue
defillama.get("/fees", async (c) => {
	const response = await fetch("https://api.llama.fi/overview/fees");

	if (!response.ok) {
		return c.json({ error: "Failed to fetch fees data" }, 500);
	}

	const data = (await response.json()) as any;

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
			revenue24h: protocol.revenue24h || 0,
			revenue7d: protocol.revenue7d || 0,
			revenue30d: protocol.revenue30d || 0,
			change_1d: protocol.change_1d || 0,
			change_7d: protocol.change_7d || 0,
			change_1m: protocol.change_1m || 0,
		}))
	);
});

// Get fees by chain
defillama.get("/fees/:chain", async (c) => {
	const { chain } = c.req.param();

	const response = await fetch(`https://api.llama.fi/overview/fees/${chain}`);

	if (!response.ok) {
		return c.json({ error: "Failed to fetch fees for chain" }, 500);
	}

	const data = (await response.json()) as any;

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
});

// Get historical fees for a specific protocol
defillama.get("/fees/summary/:protocol", async (c) => {
	const { protocol } = c.req.param();

	const response = await fetch(`https://api.llama.fi/summary/fees/${protocol}`);

	if (!response.ok) {
		return c.json({ error: "Protocol not found" }, 404);
	}

	const data = (await response.json()) as any;

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
});

// ============================================
// CATEGORIES & OVERVIEW ENDPOINTS
// ============================================

// Get all protocol categories
defillama.get("/categories", async (c) => {
	const response = await fetch("https://api.llama.fi/api/categories");

	if (!response.ok) {
		return c.json({ error: "Failed to fetch categories" }, 500);
	}

	const data = (await response.json()) as any[];

	return c.json(
		data.map((category) => ({
			name: category.name,
			tvl: category.tvl || 0,
			change_1d: category.change_1d || 0,
			change_7d: category.change_7d || 0,
			mcapTvl: category.mcapTvl || 0,
			protocols: category.protocols || 0,
			description: category.description || "",
		}))
	);
});

// ============================================
// CHARTS FOR VISUALIZATION
// ============================================

// Stablecoins market cap chart
defillama.get("/charts/stablecoins", async (c) => {
	const response = await fetch("https://stablecoins.llama.fi/stablecoincharts/all");

	if (!response.ok) {
		return c.json({ error: "Failed to fetch stablecoin data" }, 500);
	}

	const data = (await response.json()) as any[];

	return c.json(
		data.map((point) => ({
			date: point.date,
			value: point.totalCirculatingUSD?.peggedUSD || 0,
		}))
	);
});

// DEX volume chart for a specific protocol
defillama.get("/charts/dex/:protocol", async (c) => {
	const { protocol } = c.req.param();

	const response = await fetch(`https://api.llama.fi/summary/dexs/${protocol}`);

	if (!response.ok) {
		return c.json({ error: "DEX not found" }, 404);
	}

	const data = (await response.json()) as any;

	return c.json(
		data.totalDataChart?.map((point: any) => ({
			date: new Date(point[0] * 1000).toISOString().split("T")[0],
			value: point[1],
		})) || []
	);
});

// Fees chart for a specific protocol
defillama.get("/charts/fees/:protocol", async (c) => {
	const { protocol } = c.req.param();

	const response = await fetch(`https://api.llama.fi/summary/fees/${protocol}`);

	if (!response.ok) {
		return c.json({ error: "Protocol not found" }, 404);
	}

	const data = (await response.json()) as any;

	return c.json(
		data.totalDataChart?.map((point: any) => ({
			date: new Date(point[0] * 1000).toISOString().split("T")[0],
			value: point[1],
		})) || []
	);
});

// ============================================
// BRIDGES ENDPOINTS
// ============================================

// List all bridges with volume data
defillama.get("/bridges", async (c) => {
	const response = await fetch("https://bridges.llama.fi/bridges?includeChains=true");

	if (!response.ok) {
		return c.json({ error: "Failed to fetch bridges" }, 500);
	}

	const data = (await response.json()) as any;

	return c.json(
		data.bridges.map((bridge: any) => ({
			id: bridge.id,
			name: bridge.name,
			displayName: bridge.displayName,
			icon: bridge.icon,
			volumePrevDay: bridge.volumePrevDay || 0,
			volumePrev2Day: bridge.volumePrev2Day || 0,
			weeklyVolume: bridge.weeklyVolume || 0,
			monthlyVolume: bridge.monthlyVolume || 0,
			chains: bridge.chains || [],
			destinationChain: bridge.destinationChain || "",
		}))
	);
});

// Get bridge details by ID
defillama.get("/bridge/:id", async (c) => {
	const { id } = c.req.param();

	const response = await fetch(`https://bridges.llama.fi/bridge/${id}`);

	if (!response.ok) {
		return c.json({ error: "Bridge not found" }, 404);
	}

	const data = (await response.json()) as any;

	return c.json(data);
});

// ============================================
// OPTIONS/DERIVATIVES ENDPOINTS
// ============================================

// List all options DEXs
defillama.get("/options", async (c) => {
	const response = await fetch("https://api.llama.fi/overview/options");

	if (!response.ok) {
		return c.json({ error: "Failed to fetch options data" }, 500);
	}

	const data = (await response.json()) as any;

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
});

// Get options by chain
defillama.get("/options/:chain", async (c) => {
	const { chain } = c.req.param();

	const response = await fetch(`https://api.llama.fi/overview/options/${chain}`);

	if (!response.ok) {
		return c.json({ error: "Failed to fetch options for chain" }, 500);
	}

	const data = (await response.json()) as any;

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
});

// Get options summary for a protocol
defillama.get("/options/summary/:protocol", async (c) => {
	const { protocol } = c.req.param();

	const response = await fetch(`https://api.llama.fi/summary/options/${protocol}`);

	if (!response.ok) {
		return c.json({ error: "Protocol not found" }, 404);
	}

	const data = (await response.json()) as any;

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
});

// ============================================
// OPEN INTEREST ENDPOINTS
// ============================================

// Get open interest overview and statistics
defillama.get("/open-interest", async (c) => {
	const response = await fetch("https://api.llama.fi/overview/open-interest");

	if (!response.ok) {
		return c.json({ error: "Failed to fetch open interest data" }, 500);
	}

	const data = (await response.json()) as any;

	return c.json(data);
});

// Get open interest protocols table
defillama.get("/open-interest/protocols", async (c) => {
	const { search } = c.req.query();

	const response = await fetch("https://api.llama.fi/overview/open-interest");

	if (!response.ok) {
		return c.json({ error: "Failed to fetch open interest protocols" }, 500);
	}

	const data = (await response.json()) as any;

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
});

// Get open interest total data chart
defillama.get("/open-interest/chart/total", async (c) => {
	const response = await fetch("https://api.llama.fi/overview/open-interest");

	if (!response.ok) {
		return c.json({ error: "Failed to fetch open interest chart data" }, 500);
	}

	const data = (await response.json()) as any;

	return c.json(
		data.totalDataChart?.map((point: any) => ({
			date: new Date(point[0] * 1000).toISOString().split("T")[0],
			value: point[1],
		})) || []
	);
});

// Get open interest breakdown chart data
defillama.get("/open-interest/chart/breakdown", async (c) => {
	const response = await fetch("https://api.llama.fi/overview/open-interest");

	if (!response.ok) {
		return c.json({ error: "Failed to fetch open interest breakdown" }, 500);
	}

	const data = (await response.json()) as any;

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
			const normalized: Record<string, number> = {
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
});

// Get open interest stats
defillama.get("/open-interest/stats", async (c) => {
	const response = await fetch("https://api.llama.fi/overview/open-interest");

	if (!response.ok) {
		return c.json({ error: "Failed to fetch open interest stats" }, 500);
	}

	const data = (await response.json()) as any;

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
});

// ============================================
// ADDITIONAL USEFUL ENDPOINTS
// ============================================

// Get global DeFi TVL historical data
defillama.get("/charts/global-tvl", async (c) => {
	const response = await fetch("https://api.llama.fi/v2/historicalChainTvl");

	if (!response.ok) {
		return c.json({ error: "Failed to fetch global TVL" }, 500);
	}

	const data = (await response.json()) as Array<{ date: number; tvl: number }>;

	return c.json(
		data.map((point) => ({
			date: new Date(point.date * 1000).toISOString().split("T")[0],
			value: point.tvl,
		}))
	);
});

// Get current token prices
defillama.get("/prices/current/:coins", async (c) => {
	const { coins } = c.req.param();

	const response = await fetch(`https://coins.llama.fi/prices/current/${coins}`);

	if (!response.ok) {
		return c.json({ error: "Failed to fetch prices" }, 500);
	}

	const data = (await response.json()) as any;

	return c.json(data);
});

// Get historical token prices
defillama.get("/prices/historical/:timestamp/:coins", async (c) => {
	const { timestamp, coins } = c.req.param();

	const response = await fetch(`https://coins.llama.fi/prices/historical/${timestamp}/${coins}`);

	if (!response.ok) {
		return c.json({ error: "Failed to fetch historical prices" }, 500);
	}

	const data = (await response.json()) as any;

	return c.json(data);
});

export default defillama;
