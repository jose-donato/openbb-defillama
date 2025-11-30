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

export default defillama;
