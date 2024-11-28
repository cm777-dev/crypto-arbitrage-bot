import axios from 'axios';

// Base URLs for exchange APIs
const ENDPOINTS = {
  binance: 'https://api.binance.com/api/v3',
  coinbase: 'https://api.pro.coinbase.com',
  kraken: 'https://api.kraken.com/0/public',
};

// Cache for API rate limiting
const cache = {
  prices: new Map(),
  lastUpdate: new Map(),
};

const CACHE_DURATION = 10000; // 10 seconds

class ExchangeService {
  constructor() {
    this.apis = {
      binance: axios.create({ baseURL: ENDPOINTS.binance }),
      coinbase: axios.create({ baseURL: ENDPOINTS.coinbase }),
      kraken: axios.create({ baseURL: ENDPOINTS.kraken }),
    };
  }

  // Get current price from cache or API
  async getPrice(exchange, symbol) {
    const cacheKey = `${exchange}-${symbol}`;
    const now = Date.now();
    
    // Return cached price if still valid
    if (
      cache.prices.has(cacheKey) &&
      now - cache.lastUpdate.get(cacheKey) < CACHE_DURATION
    ) {
      return cache.prices.get(cacheKey);
    }

    try {
      let price;
      switch (exchange) {
        case 'binance':
          price = await this.getBinancePrice(symbol);
          break;
        case 'coinbase':
          price = await this.getCoinbasePrice(symbol);
          break;
        case 'kraken':
          price = await this.getKrakenPrice(symbol);
          break;
        default:
          throw new Error(`Unsupported exchange: ${exchange}`);
      }

      // Update cache
      cache.prices.set(cacheKey, price);
      cache.lastUpdate.set(cacheKey, now);

      return price;
    } catch (error) {
      console.error(`Error fetching price from ${exchange}:`, error);
      throw error;
    }
  }

  // Get order book to calculate real liquidity
  async getOrderBook(exchange, symbol, depth = 20) {
    try {
      switch (exchange) {
        case 'binance':
          return await this.getBinanceOrderBook(symbol, depth);
        case 'coinbase':
          return await this.getCoinbaseOrderBook(symbol, depth);
        case 'kraken':
          return await this.getKrakenOrderBook(symbol, depth);
        default:
          throw new Error(`Unsupported exchange: ${exchange}`);
      }
    } catch (error) {
      console.error(`Error fetching order book from ${exchange}:`, error);
      throw error;
    }
  }

  // Exchange-specific implementations
  async getBinancePrice(symbol) {
    const response = await this.apis.binance.get('/ticker/price', {
      params: { symbol },
    });
    return parseFloat(response.data.price);
  }

  async getCoinbasePrice(symbol) {
    const response = await this.apis.coinbase.get(`/products/${symbol}/ticker`);
    return parseFloat(response.data.price);
  }

  async getKrakenPrice(symbol) {
    const response = await this.apis.kraken.get('/Ticker', {
      params: { pair: symbol },
    });
    const data = response.data.result;
    const pair = Object.keys(data)[0];
    return parseFloat(data[pair].c[0]);
  }

  async getBinanceOrderBook(symbol, limit) {
    const response = await this.apis.binance.get('/depth', {
      params: { symbol, limit },
    });
    return {
      bids: response.data.bids.map(([price, quantity]) => ({
        price: parseFloat(price),
        quantity: parseFloat(quantity),
      })),
      asks: response.data.asks.map(([price, quantity]) => ({
        price: parseFloat(price),
        quantity: parseFloat(quantity),
      })),
    };
  }

  async getCoinbaseOrderBook(symbol, limit) {
    const response = await this.apis.coinbase.get(`/products/${symbol}/book`, {
      params: { level: 2 },
    });
    return {
      bids: response.data.bids
        .slice(0, limit)
        .map(([price, quantity]) => ({
          price: parseFloat(price),
          quantity: parseFloat(quantity),
        })),
      asks: response.data.asks
        .slice(0, limit)
        .map(([price, quantity]) => ({
          price: parseFloat(price),
          quantity: parseFloat(quantity),
        })),
    };
  }

  async getKrakenOrderBook(symbol, limit) {
    const response = await this.apis.kraken.get('/Depth', {
      params: { pair: symbol, count: limit },
    });
    const data = response.data.result;
    const pair = Object.keys(data)[0];
    return {
      bids: data[pair].bids.map(([price, quantity]) => ({
        price: parseFloat(price),
        quantity: parseFloat(quantity),
      })),
      asks: data[pair].asks.map(([price, quantity]) => ({
        price: parseFloat(price),
        quantity: parseFloat(quantity),
      })),
    };
  }

  // Calculate effective price for a given volume
  calculateEffectivePrice(orderBook, volume, side) {
    let remainingVolume = volume;
    let totalCost = 0;
    const orders = side === 'buy' ? orderBook.asks : orderBook.bids;

    for (const order of orders) {
      const fillVolume = Math.min(remainingVolume, order.quantity);
      totalCost += fillVolume * order.price;
      remainingVolume -= fillVolume;

      if (remainingVolume <= 0) break;
    }

    if (remainingVolume > 0) {
      throw new Error('Insufficient liquidity for requested volume');
    }

    return totalCost / volume;
  }

  // Get exchange account balance
  async getBalance(exchange, apiKey, apiSecret) {
    // Implementation would vary by exchange
    // This is a placeholder for the actual implementation
    return {
      BTC: 1.5,
      ETH: 20.0,
      USD: 50000.0,
    };
  }

  // Place market order
  async placeMarketOrder(exchange, apiKey, apiSecret, symbol, side, amount) {
    // Implementation would vary by exchange
    // This is a placeholder for the actual implementation
    return {
      orderId: 'mock-order-id',
      status: 'filled',
      avgPrice: 35000,
      filled: amount,
      fee: amount * 0.001,
    };
  }
}

export const exchangeService = new ExchangeService();
