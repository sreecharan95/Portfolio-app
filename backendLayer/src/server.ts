/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import puppeteer, { Browser } from 'puppeteer';
import CircuitBreaker from 'opossum';
import YahooFinance from 'yahoo-finance2';

let browserPromise: Promise<Browser> | null = null;
const aggregatedCache = new Map<string, { value: IStockCache; expiry: number }>();
const googleCache = new Map<
  string,
  { value: CachedGoogleData; expiry: number }
>();
const cmpCache = new Map<string, { value: CachedCMPData; expiry: number }>();

interface IStockCache {
  symbol: string;
  cmp: number | null;
  cmpTimestamp: number | null;
  cmpCircuitOpen: boolean;
  peRatio: number | null;
  latestEarnings: string | null;
  updatedAt: string;
  source: {
    cmp: string;
    fundamentals: string;
  };
}

type GoogleFinanceData = {
  peRatio: string | null;
  latestEarnings: string | null;
};

type CachedGoogleData = GoogleFinanceData & {
  updatedAt: string;
  source: { fundamentals: string };
};

interface CachedCMPData  {
  symbol: string;
  cmp: number | null;
  timestamp: number | null;
  circuitOpen: boolean;
};

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
      ],
    });
  }
  return browserPromise;
}

async function scrapeGoogleFinance(
  symbol: string,
  exchange = 'NASDAQ'
): Promise<GoogleFinanceData> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "userAgent", {
        get: () =>
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      });
    });
    await page.setExtraHTTPHeaders({
      'accept-language': 'en-US,en;q=0.9',
    });
    await page.goto(
      `https://www.google.com/finance/quote/${symbol}:${exchange}`,
      { waitUntil: 'networkidle2', timeout: 30000 }
    );
    await page.waitForSelector('table', { timeout: 10000 });
    const data = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tr'));
      let peRatio: string | null = null;
      let eps: string | null = null;
      for (const row of rows) {
        const cells = row.querySelectorAll('td, th');
        if (cells.length < 2) continue;
        const label = cells[0].textContent?.trim();
        const value = cells[1].textContent?.trim();
        if (!label || !value) continue;
        if (label.includes('P/E')) peRatio = value;
        if (label.includes('EPS')) eps = value;
      }
      return {
        peRatio,
        latestEarnings: eps,
      };
    });
    if (!data.peRatio && !data.latestEarnings) {
      throw new Error('Google Finance DOM data not found');
    }
    return data;
  } finally {
    await page.close();
  }
}

const googleBreaker = new CircuitBreaker(scrapeGoogleFinance, {
  timeout: 15000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
});

async function getGoogleStockData(
  symbol: string
): Promise<CachedGoogleData | null> {
  const key = `google:${symbol}`;
  const cached = googleCache.get(key);
  if (cached && cached.expiry > Date.now()) return cached.value;
  try {
    const fundamentals = await googleBreaker.fire(symbol);
    const data: CachedGoogleData = {
      ...fundamentals,
      updatedAt: new Date().toISOString(),
      source: { fundamentals: 'Google Finance (scraped)' },
    };
    googleCache.set(key, {
      value: data,
      expiry: Date.now() + 12 * 60 * 60 * 1000,
    });
    return data;
  } catch {
    return null;
  }
}

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

async function fetchYahooCMP(symbol: string): Promise<CachedCMPData> {
  const quote = await yf.quote(symbol, {
    fields: ['regularMarketPrice', 'regularMarketTime'],
  });
  return {
    symbol,
    cmp: quote?.regularMarketPrice ?? null,
    timestamp: Date.now(),
    circuitOpen: false,
  };
}

export const yahooBreaker = new CircuitBreaker(fetchYahooCMP, {
  timeout: 15000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
});

yahooBreaker.fallback((symbol: string): CachedCMPData => ({
  symbol,
  cmp: null,
  timestamp: Date.now(),
  circuitOpen: true,
}));

async function getCMP(symbol: string): Promise<CachedCMPData> {
  const key = `cmp:${symbol}`;
  const cached = cmpCache.get(key);
  if (cached && cached.expiry > Date.now()) return cached.value;
  try {
    const cmp = await yahooBreaker.fire(symbol);
    cmpCache.set(key, { value: cmp, expiry: Date.now() + 60_000 });
    return cmp;
  } catch {
    return {
      symbol,
      cmp: null,
      timestamp: Date.now(),
      circuitOpen: true,
    };
  }
}

function getAggregatedCache(key: string): IStockCache | null {
  const item = aggregatedCache.get(key);
  if (!item || Date.now() > item.expiry) {
    aggregatedCache.delete(key);
    return null;
  }
  return item.value;
}

function setAggregatedCache(key: string, value: IStockCache, ttlMs: number) {
  aggregatedCache.set(key, { value, expiry: Date.now() + ttlMs });
}

async function getAggregatedStockData(symbol: string): Promise<IStockCache> {
  const cacheKey = `stock:${symbol.toUpperCase()}`;
  const cached = getAggregatedCache(cacheKey);
  if (cached) return cached;
  const [cmpData, googleData] = await Promise.all([getCMP(symbol), getGoogleStockData(symbol)]);
  const aggregated: IStockCache = {
    symbol: cmpData.symbol.toUpperCase(),
    cmp: cmpData.cmp,
    cmpTimestamp: cmpData.timestamp,
    cmpCircuitOpen: cmpData.circuitOpen,
    peRatio: googleData?.peRatio ? parseFloat(googleData.peRatio) : null,
    latestEarnings: googleData?.latestEarnings ?? null,
    updatedAt: new Date().toISOString(),
    source: {
      cmp: "Yahoo Finance (unofficial)",
      fundamentals: "Google Finance (scraped)",
    },
  };
  setAggregatedCache(cacheKey, aggregated, 60_000); 
  return aggregated;
}

const SOCKET_STOCK_INTERVAL = 10000; 
const stockRoute = express.Router();

stockRoute.get("/:symbol", async (req, res) => {
  try {
    const data = await getAggregatedStockData(req.params.symbol);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Internal Server Error" });
  }
});

function initiateWebSocket(server: any) {
  const wss = new WebSocketServer({ server });
  wss.on("connection", (ws: WebSocket) => {
    const subscriptions = new Set<string>();
    let interval: NodeJS.Timeout | null = null;
    let active = true;
    const fetchAndSend = async () => {
      if (!active || subscriptions.size === 0) return;
      try {
        const results = await Promise.all(
          Array.from(subscriptions).map((symbol) =>
            getAggregatedStockData(symbol)
          )
        );
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "stock_update",
              data: results,
            })
          );
        }
      } catch (err: any) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: err?.message || "Unknown error",
            })
          );
        }
      }
    };
    ws.on("message", (msg) => {
      let parsed: any;
      try {
        parsed = JSON.parse(msg.toString());
      } catch {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Invalid JSON",
          })
        );
        return;
      }
      const { action, symbol } = parsed;
      if (!symbol || typeof symbol !== "string") {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Symbol required",
          })
        );
        return;
      }
      const normalizedSymbol = symbol.toUpperCase();
      if (action === "subscribe") {
        subscriptions.add(normalizedSymbol);
      } else if (action === "unsubscribe") {
        subscriptions.delete(normalizedSymbol);
      } else {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Invalid action",
          })
        );
        return;
      }
      if (!interval) {
        interval = setInterval(fetchAndSend, SOCKET_STOCK_INTERVAL);
        fetchAndSend();
      }
    });
    ws.on("close", () => {
      console.log("Client disconnected");
      active = false;
      if (interval) clearInterval(interval);
    });
    ws.on("error", (err) => {
      console.error("WebSocket error:", err);
    });
  });
}

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/stock", stockRoute);

const server = http.createServer(app);
initiateWebSocket(server);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Stock API running on port ${PORT}`);
});
