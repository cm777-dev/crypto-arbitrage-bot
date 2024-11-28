// Exchange fees for different platforms
export const exchangeFees = {
  binance: {
    maker: 0.001,
    taker: 0.001,
    withdrawal: {
      BTC: 0.0005,
      ETH: 0.005,
      USDT: 1
    }
  },
  coinbase: {
    maker: 0.005,
    taker: 0.005,
    withdrawal: {
      BTC: 0.0001,
      ETH: 0.002,
      USDT: 2
    }
  },
  kraken: {
    maker: 0.0016,
    taker: 0.0026,
    withdrawal: {
      BTC: 0.0002,
      ETH: 0.003,
      USDT: 2.5
    }
  }
};

// Mock price data for the dashboard
export const mockPriceData = Array.from({ length: 24 }, (_, i) => {
  const baseTime = Date.now() - (24 - i) * 3600000; // Last 24 hours
  return {
    timestamp: baseTime,
    binance: 35000 + Math.random() * 1000,
    coinbase: 35100 + Math.random() * 1000,
    kraken: 34900 + Math.random() * 1000,
  };
});

// Mock historical data for backtesting
export const mockHistoricalData = Array.from({ length: 1000 }, (_, i) => {
  const baseTime = new Date('2023-01-01').getTime() + i * 3600000; // Hourly data for ~42 days
  const basePrice = 35000 + Math.sin(i / 24) * 1000; // Add some cyclical variation
  
  // Add some random price differences between exchanges
  const binancePrice = basePrice + (Math.random() - 0.5) * 200;
  const coinbasePrice = basePrice + (Math.random() - 0.5) * 200;
  const krakenPrice = basePrice + (Math.random() - 0.5) * 200;
  
  // Occasionally create larger price differences for arbitrage opportunities
  const hasOpportunity = Math.random() < 0.1; // 10% chance
  if (hasOpportunity) {
    const opportunitySize = Math.random() * 100 + 50; // $50-150 difference
    if (Math.random() < 0.5) {
      coinbasePrice += opportunitySize;
    } else {
      krakenPrice += opportunitySize;
    }
  }
  
  return {
    timestamp: baseTime,
    prices: {
      binance: binancePrice,
      coinbase: coinbasePrice,
      kraken: krakenPrice
    },
    volume: Math.random() * 100000 + 50000 // Random volume between 50k-150k
  };
});

// Mock opportunities for the dashboard
export const mockOpportunities = [
  {
    id: 1,
    buyExchange: 'Binance',
    sellExchange: 'Coinbase',
    pair: 'BTC/USDT',
    buyPrice: 34950.25,
    sellPrice: 35050.75,
    volume: 1.5,
    potentialProfit: 150.75,
    timestamp: Date.now() - 300000,
    status: 'active',
    risk: 'low'
  },
  {
    id: 2,
    buyExchange: 'Kraken',
    sellExchange: 'Binance',
    pair: 'ETH/USDT',
    buyPrice: 2245.50,
    sellPrice: 2265.25,
    volume: 10,
    potentialProfit: 197.50,
    timestamp: Date.now() - 180000,
    status: 'active',
    risk: 'medium'
  },
  {
    id: 3,
    buyExchange: 'Coinbase',
    sellExchange: 'Kraken',
    pair: 'BTC/USDT',
    buyPrice: 34900.00,
    sellPrice: 35025.50,
    volume: 2.0,
    potentialProfit: 251.00,
    timestamp: Date.now() - 60000,
    status: 'active',
    risk: 'low'
  }
];
