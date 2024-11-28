import asyncio
import logging
from typing import Dict, List, Tuple
from datetime import datetime
from exchange_manager import ExchangeManager
from config import MIN_PROFIT_THRESHOLD, TRADING_PAIRS, MAX_TRADE_AMOUNT

class ArbitrageFinder:
    def __init__(self, exchange_manager: ExchangeManager):
        """
        Initialize arbitrage finder with exchange manager
        
        Args:
            exchange_manager: Instance of ExchangeManager
        """
        self.exchange_manager = exchange_manager
        self.logger = logging.getLogger(__name__)

    async def find_opportunities(self) -> List[Dict]:
        """
        Find arbitrage opportunities across all configured trading pairs and exchanges
        
        Returns:
            List of dictionaries containing arbitrage opportunities
        """
        opportunities = []
        
        for symbol in TRADING_PAIRS:
            try:
                # Get ticker data from all exchanges
                exchange_prices = {}
                tasks = []
                
                for exchange_id in self.exchange_manager.exchanges.keys():
                    tasks.append(self.exchange_manager.get_ticker(exchange_id, symbol))
                
                results = await asyncio.gather(*tasks, return_exceptions=True)
                
                for exchange_id, result in zip(self.exchange_manager.exchanges.keys(), results):
                    if isinstance(result, Exception):
                        self.logger.error(f"Error getting {symbol} price from {exchange_id}: {str(result)}")
                        continue
                    if result:
                        exchange_prices[exchange_id] = result

                # Find opportunities
                if len(exchange_prices) >= 2:
                    new_opportunities = self._analyze_price_differences(symbol, exchange_prices)
                    opportunities.extend(new_opportunities)
            
            except Exception as e:
                self.logger.error(f"Error processing {symbol}: {str(e)}")
                continue
        
        return opportunities

    def _analyze_price_differences(self, symbol: str, exchange_prices: Dict) -> List[Dict]:
        """
        Analyze price differences between exchanges for arbitrage opportunities
        
        Args:
            symbol: Trading pair symbol
            exchange_prices: Dictionary of prices from different exchanges
            
        Returns:
            List of arbitrage opportunities
        """
        opportunities = []
        
        for buy_exchange in exchange_prices:
            for sell_exchange in exchange_prices:
                if buy_exchange != sell_exchange:
                    buy_price = exchange_prices[buy_exchange]['ask']
                    sell_price = exchange_prices[sell_exchange]['bid']
                    
                    # Calculate profit percentage
                    profit_percentage = ((sell_price - buy_price) / buy_price) * 100
                    
                    # Account for trading fees
                    buy_fee = self.exchange_manager.get_trading_fee(buy_exchange)
                    sell_fee = self.exchange_manager.get_trading_fee(sell_exchange)
                    total_fee_percentage = buy_fee + sell_fee
                    net_profit_percentage = profit_percentage - total_fee_percentage
                    
                    # Check if profit meets minimum threshold
                    if net_profit_percentage >= MIN_PROFIT_THRESHOLD:
                        # Calculate optimal trade amount (respecting MAX_TRADE_AMOUNT)
                        buy_volume = exchange_prices[buy_exchange]['volume']
                        sell_volume = exchange_prices[sell_exchange]['volume']
                        max_possible_volume = min(buy_volume, sell_volume)
                        trade_amount = min(MAX_TRADE_AMOUNT / buy_price, max_possible_volume)
                        
                        # Calculate expected profit in USDT
                        expected_profit = (trade_amount * sell_price) - (trade_amount * buy_price)
                        expected_profit_after_fees = expected_profit - (
                            (trade_amount * buy_price * buy_fee / 100) +
                            (trade_amount * sell_price * sell_fee / 100)
                        )
                        
                        opportunity = {
                            'symbol': symbol,
                            'buy_exchange': buy_exchange,
                            'sell_exchange': sell_exchange,
                            'buy_price': buy_price,
                            'sell_price': sell_price,
                            'trade_amount': trade_amount,
                            'profit_percentage': net_profit_percentage,
                            'expected_profit_usdt': expected_profit_after_fees,
                            'timestamp': datetime.utcnow().isoformat(),
                            'buy_volume': buy_volume,
                            'sell_volume': sell_volume,
                            'total_fees_percentage': total_fee_percentage
                        }
                        
                        opportunities.append(opportunity)
        
        return opportunities

    async def verify_opportunity(self, opportunity: Dict) -> Tuple[bool, str]:
        """
        Verify if an arbitrage opportunity is still valid by checking order books
        
        Args:
            opportunity: Dictionary containing opportunity details
            
        Returns:
            Tuple of (is_valid, reason)
        """
        try:
            # Get order books
            buy_order_book = await self.exchange_manager.get_order_book(
                opportunity['buy_exchange'],
                opportunity['symbol']
            )
            sell_order_book = await self.exchange_manager.get_order_book(
                opportunity['sell_exchange'],
                opportunity['symbol']
            )
            
            if not buy_order_book or not sell_order_book:
                return False, "Failed to fetch order books"
            
            # Check if the required volume is available at the expected prices
            buy_volume_available = sum(amount for price, amount in buy_order_book['asks']
                                     if price <= opportunity['buy_price'] * 1.001)  # 0.1% price slippage tolerance
            sell_volume_available = sum(amount for price, amount in sell_order_book['bids']
                                      if price >= opportunity['sell_price'] * 0.999)  # 0.1% price slippage tolerance
            
            if buy_volume_available < opportunity['trade_amount']:
                return False, f"Insufficient buy volume: {buy_volume_available} < {opportunity['trade_amount']}"
            
            if sell_volume_available < opportunity['trade_amount']:
                return False, f"Insufficient sell volume: {sell_volume_available} < {opportunity['trade_amount']}"
            
            # Check if price spread still exists
            best_ask = buy_order_book['asks'][0][0]
            best_bid = sell_order_book['bids'][0][0]
            
            current_spread = ((best_bid - best_ask) / best_ask) * 100
            if current_spread < MIN_PROFIT_THRESHOLD:
                return False, f"Spread no longer profitable: {current_spread}% < {MIN_PROFIT_THRESHOLD}%"
            
            return True, "Opportunity verified"
            
        except Exception as e:
            self.logger.error(f"Error verifying opportunity: {str(e)}")
            return False, f"Verification error: {str(e)}"
