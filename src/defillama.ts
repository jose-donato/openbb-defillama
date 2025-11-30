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
	const response = await fetch("https://api.llama.fi/protocols");

	if (!response.ok) {
		return c.json({ error: "Failed to fetch protocols" }, 500);
	}

	const data = (await response.json()) as Protocol[];

	return c.json(
		data.map((protocol) => ({
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
		timestamp: point.date,
		totalLiquidityUSD: point.totalLiquidityUSD,
	})) || [];

	return c.json(tvlData);
});

// Get all chains with their TVL
defillama.get("/chains", async (c) => {
	const response = await fetch("https://api.llama.fi/v2/chains");

	if (!response.ok) {
		return c.json({ error: "Failed to fetch chains" }, 500);
	}

	const data = (await response.json()) as Chain[];

	return c.json(
		data.map((chain) => ({
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
			timestamp: point.date,
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

	const plotlyData = {
		data: [
			{
				x: sortedChains.map((chain) => chain.name),
				y: sortedChains.map((chain) => chain.tvl),
				type: "bar",
				marker: {
					color: "#00D4FF",
				},
			},
		],
		layout: {
			title: "TVL by Chain",
			xaxis: {
				title: "Chain",
			},
			yaxis: {
				title: "TVL (USD)",
			},
			plot_bgcolor: "#151518",
			paper_bgcolor: "#151518",
			font: {
				color: "#FFFFFF",
			},
		},
	};

	return c.json(plotlyData);
});

// Get historical TVL chart for a protocol
defillama.get("/charts/protocol/:slug", async (c) => {
	const { slug } = c.req.param();

	const response = await fetch(`https://api.llama.fi/protocol/${slug}`);

	if (!response.ok) {
		return c.json({ error: "Protocol not found" }, 404);
	}

	const protocol = (await response.json()) as any;

	const plotlyData = {
		data: [
			{
				x: protocol.tvl?.map((point: any) => new Date(point.date * 1000).toISOString()) || [],
				y: protocol.tvl?.map((point: any) => point.totalLiquidityUSD) || [],
				type: "scatter",
				mode: "lines",
				name: protocol.name,
				line: {
					color: "#00D4FF",
					width: 2,
				},
			},
		],
		layout: {
			title: `${protocol.name} TVL History`,
			xaxis: {
				title: "Date",
				type: "date",
			},
			yaxis: {
				title: "TVL (USD)",
			},
			plot_bgcolor: "#151518",
			paper_bgcolor: "#151518",
			font: {
				color: "#FFFFFF",
			},
			hovermode: "x unified",
		},
	};

	return c.json(plotlyData);
});

// ============================================
// STABLECOINS ENDPOINTS
// ============================================

// List all stablecoins with their circulating amounts
defillama.get("/stablecoins", async (c) => {
	const response = await fetch("https://stablecoins.llama.fi/stablecoins?includePrices=true");

	if (!response.ok) {
		return c.json({ error: "Failed to fetch stablecoins" }, 500);
	}

	const data = (await response.json()) as any;

	return c.json(
		data.peggedAssets.map((stablecoin: any) => ({
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
			timestamp: point.date,
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
			timestamp: new Date(point.date).getTime() / 1000,
			totalCirculatingUSD: point.totalCirculatingUSD?.peggedUSD || 0,
		}))
	);
});

// ============================================
// YIELDS / APY ENDPOINTS
// ============================================

// Get all yield pools with APY data
defillama.get("/yields/pools", async (c) => {
	const response = await fetch("https://yields.llama.fi/pools");

	if (!response.ok) {
		return c.json({ error: "Failed to fetch yield pools" }, 500);
	}

	const data = (await response.json()) as any;

	return c.json(
		data.data.map((pool: any) => ({
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
			timestamp: point.timestamp,
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
	const response = await fetch("https://api.llama.fi/overview/dexs");

	if (!response.ok) {
		return c.json({ error: "Failed to fetch DEXs" }, 500);
	}

	const data = (await response.json()) as any;

	return c.json(
		data.protocols.map((dex: any) => ({
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
			timestamp: point[0],
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
			timestamp: point[0],
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

	const plotlyData = {
		data: [
			{
				x: data.map((point) => point.date),
				y: data.map((point) => point.totalCirculatingUSD?.peggedUSD || 0),
				type: "scatter",
				mode: "lines",
				name: "Total Stablecoin Market Cap",
				line: {
					color: "#00D4FF",
					width: 2,
				},
			},
		],
		layout: {
			title: "Stablecoin Market Cap Over Time",
			xaxis: {
				title: "Date",
				type: "date",
			},
			yaxis: {
				title: "Market Cap (USD)",
			},
			plot_bgcolor: "#151518",
			paper_bgcolor: "#151518",
			font: {
				color: "#FFFFFF",
			},
			hovermode: "x unified",
		},
	};

	return c.json(plotlyData);
});

// DEX volume chart for a specific protocol
defillama.get("/charts/dex/:protocol", async (c) => {
	const { protocol } = c.req.param();

	const response = await fetch(`https://api.llama.fi/summary/dexs/${protocol}`);

	if (!response.ok) {
		return c.json({ error: "DEX not found" }, 404);
	}

	const data = (await response.json()) as any;

	const plotlyData = {
		data: [
			{
				x: data.totalDataChart?.map((point: any) => new Date(point[0] * 1000).toISOString()) || [],
				y: data.totalDataChart?.map((point: any) => point[1]) || [],
				type: "scatter",
				mode: "lines",
				name: data.displayName || data.name,
				line: {
					color: "#00D4FF",
					width: 2,
				},
			},
		],
		layout: {
			title: `${data.displayName || data.name} Volume History`,
			xaxis: {
				title: "Date",
				type: "date",
			},
			yaxis: {
				title: "Volume (USD)",
			},
			plot_bgcolor: "#151518",
			paper_bgcolor: "#151518",
			font: {
				color: "#FFFFFF",
			},
			hovermode: "x unified",
		},
	};

	return c.json(plotlyData);
});

// Fees chart for a specific protocol
defillama.get("/charts/fees/:protocol", async (c) => {
	const { protocol } = c.req.param();

	const response = await fetch(`https://api.llama.fi/summary/fees/${protocol}`);

	if (!response.ok) {
		return c.json({ error: "Protocol not found" }, 404);
	}

	const data = (await response.json()) as any;

	const plotlyData = {
		data: [
			{
				x: data.totalDataChart?.map((point: any) => new Date(point[0] * 1000).toISOString()) || [],
				y: data.totalDataChart?.map((point: any) => point[1]) || [],
				type: "scatter",
				mode: "lines",
				name: data.displayName || data.name,
				line: {
					color: "#00D4FF",
					width: 2,
				},
			},
		],
		layout: {
			title: `${data.displayName || data.name} Fees History`,
			xaxis: {
				title: "Date",
				type: "date",
			},
			yaxis: {
				title: "Fees (USD)",
			},
			plot_bgcolor: "#151518",
			paper_bgcolor: "#151518",
			font: {
				color: "#FFFFFF",
			},
			hovermode: "x unified",
		},
	};

	return c.json(plotlyData);
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
// HACKS & SECURITY ENDPOINTS
// ============================================

// List all hacks/exploits
defillama.get("/hacks", async (c) => {
	const response = await fetch("https://api.llama.fi/api/hacks");

	if (!response.ok) {
		return c.json({ error: "Failed to fetch hacks data" }, 500);
	}

	const data = (await response.json()) as any[];

	return c.json(
		data.map((hack) => ({
			name: hack.name,
			date: hack.date,
			amount: hack.amount || 0,
			chain: hack.chain || "",
			classification: hack.classification || "",
			technique: hack.technique || "",
			bridge: hack.bridge || "",
			targetType: hack.targetType || "",
			description: hack.description || "",
		}))
	);
});

// ============================================
// RAISES/FUNDING ENDPOINTS
// ============================================

// List all protocol raises/funding rounds
defillama.get("/raises", async (c) => {
	const response = await fetch("https://api.llama.fi/api/raises");

	if (!response.ok) {
		return c.json({ error: "Failed to fetch raises data" }, 500);
	}

	const data = (await response.json()) as any;

	return c.json(
		data.raises.map((raise: any) => ({
			name: raise.name,
			date: raise.date,
			round: raise.round || "",
			amount: raise.amount || 0,
			chains: raise.chains || [],
			sector: raise.sector || "",
			category: raise.category || "",
			source: raise.source || "",
			leadInvestors: raise.leadInvestors || [],
			otherInvestors: raise.otherInvestors || [],
			valuation: raise.valuation || 0,
			defillamaId: raise.defillamaId || "",
		}))
	);
});

// ============================================
// TREASURIES ENDPOINTS
// ============================================

// List all protocol treasuries
defillama.get("/treasuries", async (c) => {
	const response = await fetch("https://api.llama.fi/api/treasuries");

	if (!response.ok) {
		return c.json({ error: "Failed to fetch treasuries data" }, 500);
	}

	const data = (await response.json()) as any[];

	return c.json(
		data.map((treasury) => ({
			id: treasury.id,
			name: treasury.name,
			tvl: treasury.tvl || 0,
			chainTvls: treasury.chainTvls || {},
			tokens: treasury.tokens || [],
			tokenBreakdowns: treasury.tokenBreakdowns || {},
		}))
	);
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
			timestamp: point[0],
			volume: point[1],
		})) || [],
	});
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

	const plotlyData = {
		data: [
			{
				x: data.map((point) => new Date(point.date * 1000).toISOString()),
				y: data.map((point) => point.tvl),
				type: "scatter",
				mode: "lines",
				name: "Global DeFi TVL",
				line: {
					color: "#00D4FF",
					width: 2,
				},
			},
		],
		layout: {
			title: "Global DeFi TVL Over Time",
			xaxis: {
				title: "Date",
				type: "date",
			},
			yaxis: {
				title: "TVL (USD)",
			},
			plot_bgcolor: "#151518",
			paper_bgcolor: "#151518",
			font: {
				color: "#FFFFFF",
			},
			hovermode: "x unified",
		},
	};

	return c.json(plotlyData);
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
