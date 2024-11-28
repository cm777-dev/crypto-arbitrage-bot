import asyncio
import logging
import os
from datetime import datetime
from typing import Dict, List
from exchange_manager import ExchangeManager
from arbitrage_finder import ArbitrageFinder
from trader import Trader
from config import (
    EXCHANGES, BINANCE_API_KEY, BINANCE_SECRET_KEY,
    COINBASE_API_KEY, COINBASE_SECRET_KEY,
    KRAKEN_API_KEY, KRAKEN_SECRET_KEY,
    CHECK_INTERVAL, LOG_CONFIG
)

# Configure logging
logging.basicConfig(
    filename=LOG_CONFIG['filename'],
    level=getattr(logging, LOG_CONFIG['level']),
    format=LOG_CONFIG['format']
)
logger = logging.getLogger(__name__)

# Configure console logging
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

class ArbitrageBot:
    def __init__(self):
        """Initialize the arbitrage bot with necessary components"""
        # API keys for each exchange
        self.api_keys = {
            'binance': {
                'api_key': BINANCE_API_KEY,
                'secret_key': BINANCE_SECRET_KEY
            },
            'coinbase': {
                'api_key': COINBASE_API_KEY,
                'secret_key': COINBASE_SECRET_KEY
            },
            'kraken': {
                'api_key': KRAKEN_API_KEY,
                'secret_key': KRAKEN_SECRET_KEY
            }
        }
        
        # Initialize components
        self.exchange_manager = ExchangeManager(EXCHANGES, self.api_keys)
        self.arbitrage_finder = ArbitrageFinder(self.exchange_manager)
        self.trader = Trader(self.exchange_manager, self.arbitrage_finder)
        
        # Statistics
        self.stats = {
            'opportunities_found': 0,
            'trades_executed': 0,
            'successful_trades': 0,
            'failed_trades': 0,
            'total_profit': 0.0,
            'start_time': datetime.utcnow().isoformat()
        }

    async def run(self):
        """Main loop for the arbitrage bot"""
        logger.info("Starting arbitrage bot...")
        
        try:
            while True:
                try:
                    # Find arbitrage opportunities
                    opportunities = await self.arbitrage_finder.find_opportunities()
                    self.stats['opportunities_found'] += len(opportunities)
                    
                    if opportunities:
                        logger.info(f"Found {len(opportunities)} potential arbitrage opportunities")
                        
                        # Sort opportunities by expected profit
                        opportunities.sort(key=lambda x: x['expected_profit_usdt'], reverse=True)
                        
                        # Execute the most profitable opportunity
                        best_opportunity = opportunities[0]
                        logger.info(f"Attempting to execute best opportunity: {best_opportunity}")
                        
                        self.stats['trades_executed'] += 1
                        trade_result = await self.trader.execute_arbitrage(best_opportunity)
                        
                        if trade_result:
                            self.stats['successful_trades'] += 1
                            self.stats['total_profit'] += trade_result['actual_profit']
                            logger.info(f"Trade successful! Profit: {trade_result['actual_profit']} USDT")
                            
                            # Start monitoring the trade
                            self.trader.start_trade_monitor(trade_result)
                        else:
                            self.stats['failed_trades'] += 1
                            logger.warning("Trade execution failed")
                    
                    # Log current statistics
                    self._log_statistics()
                    
                    # Wait for next check interval
                    await asyncio.sleep(CHECK_INTERVAL)
                    
                except Exception as e:
                    logger.error(f"Error in main loop: {str(e)}")
                    await asyncio.sleep(CHECK_INTERVAL)
                    
        except KeyboardInterrupt:
            logger.info("Shutting down arbitrage bot...")
            await self.shutdown()
    
    def _log_statistics(self):
        """Log current bot statistics"""
        runtime = (datetime.utcnow() - datetime.fromisoformat(self.stats['start_time'])).total_seconds()
        hours = runtime / 3600
        
        stats_message = f"""
        === Arbitrage Bot Statistics ===
        Runtime: {hours:.2f} hours
        Opportunities Found: {self.stats['opportunities_found']}
        Trades Executed: {self.stats['trades_executed']}
        Successful Trades: {self.stats['successful_trades']}
        Failed Trades: {self.stats['failed_trades']}
        Total Profit: {self.stats['total_profit']:.2f} USDT
        Success Rate: {(self.stats['successful_trades'] / max(1, self.stats['trades_executed']) * 100):.2f}%
        Profit per Hour: {(self.stats['total_profit'] / max(1, hours)):.2f} USDT
        ==============================
        """
        logger.info(stats_message)
    
    async def shutdown(self):
        """Gracefully shutdown the bot"""
        logger.info("Closing exchange connections...")
        await self.exchange_manager.close_connections()
        logger.info("Bot shutdown complete")

async def main():
    """Entry point for the arbitrage bot"""
    # Check if required API keys are set
    if not all([
        BINANCE_API_KEY, BINANCE_SECRET_KEY,
        COINBASE_API_KEY, COINBASE_SECRET_KEY,
        KRAKEN_API_KEY, KRAKEN_SECRET_KEY
    ]):
        logger.error("Missing required API keys. Please check your configuration.")
        return

    # Create log directory if it doesn't exist
    log_dir = os.path.dirname(LOG_CONFIG['filename'])
    if log_dir and not os.path.exists(log_dir):
        os.makedirs(log_dir)

    # Start the bot
    bot = ArbitrageBot()
    await bot.run()

if __name__ == "__main__":
    asyncio.run(main())
