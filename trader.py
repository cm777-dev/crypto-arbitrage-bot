import asyncio
import logging
from typing import Dict, Optional
from datetime import datetime
from exchange_manager import ExchangeManager
from arbitrage_finder import ArbitrageFinder
from config import STOP_LOSS_PERCENTAGE, TAKE_PROFIT_PERCENTAGE

class Trader:
    def __init__(self, exchange_manager: ExchangeManager, arbitrage_finder: ArbitrageFinder):
        """
        Initialize trader with exchange manager and arbitrage finder
        
        Args:
            exchange_manager: Instance of ExchangeManager
            arbitrage_finder: Instance of ArbitrageFinder
        """
        self.exchange_manager = exchange_manager
        self.arbitrage_finder = arbitrage_finder
        self.logger = logging.getLogger(__name__)
        self.active_trades = {}

    async def execute_arbitrage(self, opportunity: Dict) -> Optional[Dict]:
        """
        Execute an arbitrage opportunity
        
        Args:
            opportunity: Dictionary containing opportunity details
            
        Returns:
            Dictionary containing trade results or None if failed
        """
        try:
            # Verify opportunity is still valid
            is_valid, reason = await self.arbitrage_finder.verify_opportunity(opportunity)
            if not is_valid:
                self.logger.warning(f"Opportunity no longer valid: {reason}")
                return None

            # Check if we have sufficient balance
            buy_currency = opportunity['symbol'].split('/')[1]  # Quote currency (e.g., USDT)
            buy_exchange = opportunity['buy_exchange']
            
            balance = await self.exchange_manager.get_balance(buy_exchange, buy_currency)
            if not balance or balance < opportunity['trade_amount'] * opportunity['buy_price']:
                self.logger.error(f"Insufficient balance in {buy_exchange}")
                return None

            # Execute buy order
            buy_order = await self.exchange_manager.place_order(
                buy_exchange,
                opportunity['symbol'],
                'market',
                'buy',
                opportunity['trade_amount']
            )
            
            if not buy_order:
                self.logger.error("Failed to execute buy order")
                return None

            self.logger.info(f"Buy order executed: {buy_order['id']}")

            # Execute sell order
            sell_order = await self.exchange_manager.place_order(
                opportunity['sell_exchange'],
                opportunity['symbol'],
                'market',
                'sell',
                opportunity['trade_amount']
            )
            
            if not sell_order:
                self.logger.error("Failed to execute sell order")
                # Implement emergency sell on buy exchange
                await self._emergency_sell(buy_exchange, opportunity['symbol'], opportunity['trade_amount'])
                return None

            self.logger.info(f"Sell order executed: {sell_order['id']}")

            # Calculate actual profit
            actual_profit = (
                sell_order['price'] * sell_order['amount'] -
                buy_order['price'] * buy_order['amount']
            )

            trade_result = {
                'id': f"{buy_order['id']}_{sell_order['id']}",
                'symbol': opportunity['symbol'],
                'buy_exchange': buy_exchange,
                'sell_exchange': opportunity['sell_exchange'],
                'buy_price': buy_order['price'],
                'sell_price': sell_order['price'],
                'amount': buy_order['amount'],
                'expected_profit': opportunity['expected_profit_usdt'],
                'actual_profit': actual_profit,
                'timestamp': datetime.utcnow().isoformat(),
                'status': 'completed'
            }

            self.logger.info(f"Arbitrage trade completed: {trade_result}")
            return trade_result

        except Exception as e:
            self.logger.error(f"Error executing arbitrage: {str(e)}")
            return None

    async def _emergency_sell(self, exchange_id: str, symbol: str, amount: float) -> None:
        """
        Emergency sell in case of failed arbitrage
        
        Args:
            exchange_id: ID of the exchange
            symbol: Trading pair symbol
            amount: Amount to sell
        """
        try:
            self.logger.warning(f"Executing emergency sell for {amount} {symbol} on {exchange_id}")
            
            sell_order = await self.exchange_manager.place_order(
                exchange_id,
                symbol,
                'market',
                'sell',
                amount
            )
            
            if sell_order:
                self.logger.info(f"Emergency sell completed: {sell_order['id']}")
            else:
                self.logger.error("Failed to execute emergency sell")
                
        except Exception as e:
            self.logger.error(f"Error during emergency sell: {str(e)}")

    async def monitor_trade(self, trade_id: str) -> None:
        """
        Monitor an active trade for stop loss and take profit
        
        Args:
            trade_id: ID of the trade to monitor
        """
        trade = self.active_trades.get(trade_id)
        if not trade:
            return

        try:
            while True:
                # Get current price
                ticker = await self.exchange_manager.get_ticker(
                    trade['buy_exchange'],
                    trade['symbol']
                )
                
                if not ticker:
                    continue

                current_price = ticker['last']
                entry_price = trade['buy_price']

                # Check stop loss
                stop_loss_price = entry_price * (1 - STOP_LOSS_PERCENTAGE / 100)
                if current_price <= stop_loss_price:
                    await self._emergency_sell(
                        trade['buy_exchange'],
                        trade['symbol'],
                        trade['amount']
                    )
                    trade['status'] = 'stopped_loss'
                    break

                # Check take profit
                take_profit_price = entry_price * (1 + TAKE_PROFIT_PERCENTAGE / 100)
                if current_price >= take_profit_price:
                    await self.exchange_manager.place_order(
                        trade['buy_exchange'],
                        trade['symbol'],
                        'market',
                        'sell',
                        trade['amount']
                    )
                    trade['status'] = 'take_profit'
                    break

                await asyncio.sleep(1)  # Check every second

        except Exception as e:
            self.logger.error(f"Error monitoring trade {trade_id}: {str(e)}")
        finally:
            if trade_id in self.active_trades:
                del self.active_trades[trade_id]

    def start_trade_monitor(self, trade: Dict) -> None:
        """
        Start monitoring a new trade
        
        Args:
            trade: Dictionary containing trade details
        """
        self.active_trades[trade['id']] = trade
        asyncio.create_task(self.monitor_trade(trade['id']))
