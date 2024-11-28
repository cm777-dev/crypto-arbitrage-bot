import { exchangeService } from './exchangeService';
import { validateArbitrageOpportunity } from '../utils/arbitrageCalculator';

class ArbitrageService {
  constructor() {
    this.supportedExchanges = ['binance', 'coinbase', 'kraken'];
    this.supportedPairs = ['BTCUSDT', 'ETHUSDT'];
    this.opportunities = new Map();
    this.isMonitoring = false;
    this.monitoringInterval = null;
  }

  // Start monitoring for arbitrage opportunities
  startMonitoring(config = {}) {
    if (this.isMonitoring) return;

    const {
      interval = 10000, // 10 seconds
      minProfitThreshold = 50, // $50
      maxTradeAmount = 10000, // $10,000
      autoTrade = false,
    } = config;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(
      () => this.scanForOpportunities(config),
      interval
    );

    console.log('Started monitoring for arbitrage opportunities');
  }

  // Stop monitoring
  stopMonitoring() {
    if (!this.isMonitoring) return;

    clearInterval(this.monitoringInterval);
    this.isMonitoring = false;
    this.opportunities.clear();

    console.log('Stopped monitoring for arbitrage opportunities');
  }

  // Scan all exchanges for arbitrage opportunities
  async scanForOpportunities(config) {
    const opportunities = [];

    for (const pair of this.supportedPairs) {
      const prices = new Map();

      // Fetch prices from all exchanges
      for (const exchange of this.supportedExchanges) {
        try {
          const price = await exchangeService.getPrice(exchange, pair);
          prices.set(exchange, price);
        } catch (error) {
          console.error(`Error fetching ${pair} price from ${exchange}:`, error);
        }
      }

      // Find arbitrage opportunities
      for (const buyExchange of this.supportedExchanges) {
        for (const sellExchange of this.supportedExchanges) {
          if (buyExchange === sellExchange) continue;

          const buyPrice = prices.get(buyExchange);
          const sellPrice = prices.get(sellExchange);

          if (!buyPrice || !sellPrice) continue;

          // Skip if sell price is not higher than buy price
          if (sellPrice <= buyPrice) continue;

          try {
            // Get order books to calculate real liquidity
            const [buyOrderBook, sellOrderBook] = await Promise.all([
              exchangeService.getOrderBook(buyExchange, pair),
              exchangeService.getOrderBook(sellExchange, pair),
            ]);

            // Calculate optimal trade amount based on order books
            const tradeAmount = this.calculateOptimalTradeAmount(
              buyOrderBook,
              sellOrderBook,
              buyPrice,
              sellPrice,
              config.maxTradeAmount
            );

            // Validate the opportunity
            const validation = validateArbitrageOpportunity({
              buyExchange,
              sellExchange,
              buyPrice,
              sellPrice,
              amount: tradeAmount,
              pair,
              liquidity: Math.min(
                this.calculateTotalLiquidity(buyOrderBook.asks),
                this.calculateTotalLiquidity(sellOrderBook.bids)
              ),
            });

            // Only add if the opportunity is viable and meets profit threshold
            if (
              validation.isViable &&
              validation.adjustedProfit >= config.minProfitThreshold
            ) {
              opportunities.push({
                id: `${buyExchange}-${sellExchange}-${pair}-${Date.now()}`,
                pair,
                buyExchange,
                sellExchange,
                buyPrice,
                sellPrice,
                tradeAmount,
                timestamp: Date.now(),
                ...validation,
              });

              // Execute trade if auto-trading is enabled
              if (config.autoTrade) {
                this.executeTrade({
                  buyExchange,
                  sellExchange,
                  pair,
                  amount: tradeAmount,
                  validation,
                });
              }
            }
          } catch (error) {
            console.error(
              `Error analyzing opportunity for ${pair} between ${buyExchange} and ${sellExchange}:`,
              error
            );
          }
        }
      }
    }

    // Update opportunities map
    this.opportunities.clear();
    opportunities.forEach((opp) => this.opportunities.set(opp.id, opp));

    return opportunities;
  }

  // Calculate optimal trade amount based on order books
  calculateOptimalTradeAmount(
    buyOrderBook,
    sellOrderBook,
    buyPrice,
    sellPrice,
    maxAmount
  ) {
    let amount = 0;
    let buyDepth = 0;
    let sellDepth = 0;

    // Calculate maximum amount that can be traded while maintaining profit
    for (let i = 0; i < Math.min(buyOrderBook.asks.length, sellOrderBook.bids.length); i++) {
      const buyOrder = buyOrderBook.asks[i];
      const sellOrder = sellOrderBook.bids[i];

      if (sellOrder.price <= buyOrder.price) break;

      const availableAmount = Math.min(buyOrder.quantity, sellOrder.quantity);
      if (buyDepth + availableAmount * buyOrder.price > maxAmount) {
        const remainingBudget = maxAmount - buyDepth;
        amount += remainingBudget / buyOrder.price;
        break;
      }

      amount += availableAmount;
      buyDepth += availableAmount * buyOrder.price;
      sellDepth += availableAmount * sellOrder.price;
    }

    return amount;
  }

  // Calculate total liquidity in an order book side
  calculateTotalLiquidity(orders) {
    return orders.reduce((total, order) => total + order.price * order.quantity, 0);
  }

  // Execute arbitrage trade
  async executeTrade({ buyExchange, sellExchange, pair, amount, validation }) {
    try {
      console.log(`Executing arbitrage trade for ${pair}`);
      console.log(`Buying ${amount} on ${buyExchange}`);
      console.log(`Selling ${amount} on ${sellExchange}`);

      // Get API keys from settings (in a real implementation)
      const apiKeys = {
        [buyExchange]: { key: 'mock-key', secret: 'mock-secret' },
        [sellExchange]: { key: 'mock-key', secret: 'mock-secret' },
      };

      // Execute trades simultaneously
      const [buyOrder, sellOrder] = await Promise.all([
        exchangeService.placeMarketOrder(
          buyExchange,
          apiKeys[buyExchange].key,
          apiKeys[buyExchange].secret,
          pair,
          'buy',
          amount
        ),
        exchangeService.placeMarketOrder(
          sellExchange,
          apiKeys[sellExchange].key,
          apiKeys[sellExchange].secret,
          pair,
          'sell',
          amount
        ),
      ]);

      console.log('Trade executed successfully');
      console.log('Buy order:', buyOrder);
      console.log('Sell order:', sellOrder);

      // Calculate actual profit
      const actualProfit =
        sellOrder.filled * sellOrder.avgPrice -
        buyOrder.filled * buyOrder.avgPrice -
        (buyOrder.fee + sellOrder.fee);

      console.log('Actual profit:', actualProfit);

      return {
        success: true,
        buyOrder,
        sellOrder,
        actualProfit,
      };
    } catch (error) {
      console.error('Error executing trade:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get current opportunities
  getOpportunities() {
    return Array.from(this.opportunities.values());
  }
}

export const arbitrageService = new ArbitrageService();
