import { exchangeFees } from './mockData';
import Decimal from 'decimal.js';

export const calculateNetProfit = ({
  buyExchange,
  sellExchange,
  buyPrice,
  sellPrice,
  amount,
  pair
}) => {
  const buyFees = calculateTradingFees(buyExchange, amount, buyPrice);
  const sellFees = calculateTradingFees(sellExchange, amount, sellPrice);
  const withdrawalFees = calculateWithdrawalFees(buyExchange, sellExchange, pair);
  
  const grossProfit = new Decimal(sellPrice)
    .minus(buyPrice)
    .times(amount);
    
  const netProfit = grossProfit
    .minus(buyFees)
    .minus(sellFees)
    .minus(withdrawalFees);
    
  return {
    grossProfit: grossProfit.toNumber(),
    netProfit: netProfit.toNumber(),
    fees: {
      buyFees: buyFees.toNumber(),
      sellFees: sellFees.toNumber(),
      withdrawalFees: withdrawalFees.toNumber(),
      totalFees: buyFees.plus(sellFees).plus(withdrawalFees).toNumber()
    }
  };
};

const calculateTradingFees = (exchange, amount, price) => {
  const fee = new Decimal(exchangeFees[exchange].taker);
  return new Decimal(amount)
    .times(price)
    .times(fee);
};

const calculateWithdrawalFees = (fromExchange, toExchange, pair) => {
  const [asset] = pair.split('/');
  return new Decimal(exchangeFees[fromExchange].withdrawal[asset] || 0);
};

export const estimateSlippage = (volume, liquidity) => {
  // Basic slippage estimation model
  // Higher volume relative to liquidity = higher slippage
  const slippagePercentage = Math.min(
    (volume / liquidity) * 100,
    5 // Cap at 5% maximum slippage
  );
  return slippagePercentage;
};

export const calculateTransferTime = (fromExchange, toExchange, asset) => {
  // Estimated transfer times in minutes for different networks
  const networkTimes = {
    BTC: 30,
    ETH: 15,
    TRX: 3,
    BSC: 5,
    USD: 1 // For stablecoins on fast networks
  };
  
  return networkTimes[asset] || 15; // Default to 15 minutes if unknown
};

export const validateArbitrageOpportunity = ({
  buyExchange,
  sellExchange,
  buyPrice,
  sellPrice,
  amount,
  pair,
  liquidity
}) => {
  const profitDetails = calculateNetProfit({
    buyExchange,
    sellExchange,
    buyPrice,
    sellPrice,
    amount,
    pair
  });
  
  const [asset] = pair.split('/');
  const transferTime = calculateTransferTime(buyExchange, sellExchange, asset);
  const slippage = estimateSlippage(amount, liquidity);
  
  // Calculate price after slippage
  const effectiveBuyPrice = new Decimal(buyPrice)
    .times(1 + slippage / 100)
    .toNumber();
  const effectiveSellPrice = new Decimal(sellPrice)
    .times(1 - slippage / 100)
    .toNumber();
    
  const adjustedProfit = calculateNetProfit({
    buyExchange,
    sellExchange,
    buyPrice: effectiveBuyPrice,
    sellPrice: effectiveSellPrice,
    amount,
    pair
  });

  // Check exchange limits
  const withinLimits = checkExchangeLimits(buyExchange, sellExchange, amount, pair);
  
  return {
    ...profitDetails,
    adjustedProfit: adjustedProfit.netProfit,
    slippage,
    transferTime,
    withinLimits,
    isViable: adjustedProfit.netProfit > 0 && withinLimits,
    riskLevel: calculateRiskLevel(slippage, transferTime, adjustedProfit.netProfit)
  };
};

const checkExchangeLimits = (buyExchange, sellExchange, amount, pair) => {
  // Mock exchange limits - in real implementation, these would be fetched from exchange APIs
  const limits = {
    binance: {
      BTC: { min: 0.0001, max: 100 },
      ETH: { min: 0.001, max: 1000 }
    },
    coinbase: {
      BTC: { min: 0.0001, max: 50 },
      ETH: { min: 0.001, max: 500 }
    },
    kraken: {
      BTC: { min: 0.0001, max: 75 },
      ETH: { min: 0.001, max: 750 }
    }
  };
  
  const [asset] = pair.split('/');
  const buyLimit = limits[buyExchange]?.[asset];
  const sellLimit = limits[sellExchange]?.[asset];
  
  if (!buyLimit || !sellLimit) return false;
  
  return amount >= buyLimit.min && 
         amount <= buyLimit.max && 
         amount >= sellLimit.min && 
         amount <= sellLimit.max;
};

const calculateRiskLevel = (slippage, transferTime, adjustedProfit) => {
  // Risk scoring based on multiple factors
  let riskScore = 0;
  
  // Slippage risk (0-40 points)
  riskScore += (slippage / 5) * 40;
  
  // Transfer time risk (0-30 points)
  riskScore += (transferTime / 30) * 30;
  
  // Profit margin risk (0-30 points)
  const profitMarginRisk = Math.max(0, (1 - adjustedProfit / 100) * 30);
  riskScore += profitMarginRisk;
  
  // Convert score to risk level
  if (riskScore < 30) return 'low';
  if (riskScore < 60) return 'medium';
  return 'high';
};
