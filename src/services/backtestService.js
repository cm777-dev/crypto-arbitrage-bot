import Decimal from 'decimal.js';
import { exchangeFees } from '../utils/mockData';

class BacktestService {
  constructor(config = {}) {
    this.initialBalance = new Decimal(config.initialBalance || 10000);
    this.startDate = config.startDate || new Date('2023-01-01');
    this.endDate = config.endDate || new Date();
    this.minProfitThreshold = new Decimal(config.minProfitThreshold || 50);
    this.maxTradeAmount = new Decimal(config.maxTradeAmount || 10000);
    this.fees = exchangeFees;
    
    // Initialize portfolio
    this.portfolio = {
      USD: this.initialBalance,
      BTC: new Decimal(0),
      ETH: new Decimal(0)
    };
    
    // Track performance metrics
    this.metrics = {
      totalTrades: 0,
      successfulTrades: 0,
      failedTrades: 0,
      totalProfit: new Decimal(0),
      maxDrawdown: new Decimal(0),
      profitFactor: new Decimal(0),
      winRate: new Decimal(0),
      trades: []
    };
  }

  async runBacktest(historicalData) {
    console.log('Starting backtest...');
    console.log(`Initial Balance: $${this.initialBalance}`);
    
    let maxPortfolioValue = this.initialBalance;
    let currentDrawdown = new Decimal(0);
    let totalWinAmount = new Decimal(0);
    let totalLossAmount = new Decimal(0);

    for (const dataPoint of historicalData) {
      const opportunities = this.findArbitrageOpportunities(dataPoint);
      
      for (const opportunity of opportunities) {
        if (this.validateTrade(opportunity)) {
          const tradeResult = this.executeTrade(opportunity, dataPoint.timestamp);
          
          // Update metrics
          this.metrics.totalTrades++;
          if (tradeResult.profit.greaterThan(0)) {
            this.metrics.successfulTrades++;
            totalWinAmount = totalWinAmount.plus(tradeResult.profit);
          } else {
            this.metrics.failedTrades++;
            totalLossAmount = totalLossAmount.plus(tradeResult.profit.abs());
          }
          
          this.metrics.trades.push(tradeResult);
          
          // Update drawdown
          const currentPortfolioValue = this.calculatePortfolioValue(dataPoint);
          if (currentPortfolioValue.greaterThan(maxPortfolioValue)) {
            maxPortfolioValue = currentPortfolioValue;
          } else {
            const newDrawdown = maxPortfolioValue.minus(currentPortfolioValue)
              .dividedBy(maxPortfolioValue)
              .times(100);
            if (newDrawdown.greaterThan(currentDrawdown)) {
              currentDrawdown = newDrawdown;
              this.metrics.maxDrawdown = currentDrawdown;
            }
          }
        }
      }
    }
    
    // Calculate final metrics
    this.metrics.totalProfit = totalWinAmount.minus(totalLossAmount);
    this.metrics.profitFactor = totalWinAmount.dividedBy(totalLossAmount.equals(0) ? 1 : totalLossAmount);
    this.metrics.winRate = new Decimal(this.metrics.successfulTrades)
      .dividedBy(this.metrics.totalTrades || 1)
      .times(100);
    
    return this.generateReport();
  }

  findArbitrageOpportunities(dataPoint) {
    const opportunities = [];
    const exchanges = Object.keys(dataPoint.prices);
    
    for (let i = 0; i < exchanges.length; i++) {
      for (let j = i + 1; j < exchanges.length; j++) {
        const exchange1 = exchanges[i];
        const exchange2 = exchanges[j];
        
        const price1 = new Decimal(dataPoint.prices[exchange1]);
        const price2 = new Decimal(dataPoint.prices[exchange2]);
        
        if (price1.lessThan(price2)) {
          const profit = this.calculateProfit(
            exchange1,
            exchange2,
            price1,
            price2,
            dataPoint.volume
          );
          
          if (profit.greaterThan(this.minProfitThreshold)) {
            opportunities.push({
              buyExchange: exchange1,
              sellExchange: exchange2,
              buyPrice: price1,
              sellPrice: price2,
              potentialProfit: profit,
              timestamp: dataPoint.timestamp
            });
          }
        }
      }
    }
    
    return opportunities;
  }

  calculateProfit(buyExchange, sellExchange, buyPrice, sellPrice, volume) {
    const tradeAmount = Decimal.min(
      this.maxTradeAmount,
      this.portfolio.USD,
      new Decimal(volume).times(buyPrice)
    );
    
    const buyFee = tradeAmount.times(this.fees[buyExchange.toLowerCase()].taker);
    const sellFee = tradeAmount.times(this.fees[sellExchange.toLowerCase()].taker);
    
    const cryptoAmount = tradeAmount.dividedBy(buyPrice);
    const sellAmount = cryptoAmount.times(sellPrice);
    
    return sellAmount.minus(tradeAmount).minus(buyFee).minus(sellFee);
  }

  validateTrade(opportunity) {
    return (
      opportunity.potentialProfit.greaterThan(this.minProfitThreshold) &&
      this.portfolio.USD.greaterThan(0)
    );
  }

  executeTrade(opportunity, timestamp) {
    const tradeAmount = Decimal.min(
      this.maxTradeAmount,
      this.portfolio.USD
    );
    
    // Calculate fees
    const buyFee = tradeAmount.times(
      this.fees[opportunity.buyExchange.toLowerCase()].taker
    );
    const sellFee = tradeAmount.times(
      this.fees[opportunity.sellExchange.toLowerCase()].taker
    );
    
    // Execute buy
    this.portfolio.USD = this.portfolio.USD.minus(tradeAmount).minus(buyFee);
    const cryptoAmount = tradeAmount.dividedBy(opportunity.buyPrice);
    this.portfolio.BTC = this.portfolio.BTC.plus(cryptoAmount);
    
    // Execute sell
    this.portfolio.BTC = this.portfolio.BTC.minus(cryptoAmount);
    const sellAmount = cryptoAmount.times(opportunity.sellPrice);
    this.portfolio.USD = this.portfolio.USD.plus(sellAmount).minus(sellFee);
    
    // Calculate actual profit
    const profit = sellAmount.minus(tradeAmount).minus(buyFee).minus(sellFee);
    
    return {
      timestamp,
      buyExchange: opportunity.buyExchange,
      sellExchange: opportunity.sellExchange,
      buyPrice: opportunity.buyPrice,
      sellPrice: opportunity.sellPrice,
      amount: tradeAmount,
      profit,
      fees: buyFee.plus(sellFee)
    };
  }

  calculatePortfolioValue(dataPoint) {
    const btcValue = this.portfolio.BTC.times(dataPoint.prices.binance); // Using Binance as reference
    return this.portfolio.USD.plus(btcValue);
  }

  generateReport() {
    return {
      summary: {
        initialBalance: this.initialBalance.toNumber(),
        finalBalance: this.calculatePortfolioValue({
          prices: { binance: this.metrics.trades[this.metrics.trades.length - 1]?.buyPrice || 0 }
        }).toNumber(),
        totalTrades: this.metrics.totalTrades,
        successfulTrades: this.metrics.successfulTrades,
        failedTrades: this.metrics.failedTrades,
        totalProfit: this.metrics.totalProfit.toNumber(),
        profitFactor: this.metrics.profitFactor.toNumber(),
        winRate: this.metrics.winRate.toNumber(),
        maxDrawdown: this.metrics.maxDrawdown.toNumber()
      },
      trades: this.metrics.trades.map(trade => ({
        ...trade,
        profit: trade.profit.toNumber(),
        fees: trade.fees.toNumber(),
        amount: trade.amount.toNumber()
      })),
      config: {
        startDate: this.startDate,
        endDate: this.endDate,
        minProfitThreshold: this.minProfitThreshold.toNumber(),
        maxTradeAmount: this.maxTradeAmount.toNumber()
      }
    };
  }
}

export default BacktestService;
