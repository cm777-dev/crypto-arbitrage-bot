import ccxt
import asyncio
import logging
from typing import Dict, List, Optional
from config import EXCHANGE_FEES, REQUEST_TIMEOUT, MAX_RETRIES, RETRY_DELAY

class ExchangeManager:
    def __init__(self, exchange_ids: List[str], api_keys: Dict[str, Dict[str, str]]):
        """
        Initialize exchange connections with API keys
        
        Args:
            exchange_ids: List of exchange IDs to connect to
            api_keys: Dictionary of API keys for each exchange
        """
        self.exchanges = {}
        self.logger = logging.getLogger(__name__)
        
        for exchange_id in exchange_ids:
            try:
                exchange_class = getattr(ccxt, exchange_id)
                exchange = exchange_class({
                    'apiKey': api_keys[exchange_id]['api_key'],
                    'secret': api_keys[exchange_id]['secret_key'],
                    'timeout': REQUEST_TIMEOUT * 1000,  # Convert to milliseconds
                    'enableRateLimit': True
                })
                self.exchanges[exchange_id] = exchange
                self.logger.info(f"Successfully connected to {exchange_id}")
            except Exception as e:
                self.logger.error(f"Failed to connect to {exchange_id}: {str(e)}")
                raise

    async def get_ticker(self, exchange_id: str, symbol: str) -> Optional[Dict]:
        """
        Get current ticker data for a symbol from an exchange
        
        Args:
            exchange_id: ID of the exchange
            symbol: Trading pair symbol
            
        Returns:
            Dictionary containing ticker data or None if failed
        """
        exchange = self.exchanges.get(exchange_id)
        if not exchange:
            self.logger.error(f"Exchange {exchange_id} not found")
            return None

        for attempt in range(MAX_RETRIES):
            try:
                ticker = await exchange.fetch_ticker(symbol)
                return {
                    'bid': ticker['bid'],
                    'ask': ticker['ask'],
                    'last': ticker['last'],
                    'volume': ticker['baseVolume'],
                    'timestamp': ticker['timestamp']
                }
            except Exception as e:
                self.logger.warning(f"Attempt {attempt + 1} failed for {exchange_id} {symbol}: {str(e)}")
                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(RETRY_DELAY)
                else:
                    self.logger.error(f"Failed to get ticker for {exchange_id} {symbol} after {MAX_RETRIES} attempts")
                    return None

    async def get_order_book(self, exchange_id: str, symbol: str, limit: int = 20) -> Optional[Dict]:
        """
        Get order book data for a symbol from an exchange
        
        Args:
            exchange_id: ID of the exchange
            symbol: Trading pair symbol
            limit: Depth of the order book
            
        Returns:
            Dictionary containing order book data or None if failed
        """
        exchange = self.exchanges.get(exchange_id)
        if not exchange:
            self.logger.error(f"Exchange {exchange_id} not found")
            return None

        for attempt in range(MAX_RETRIES):
            try:
                order_book = await exchange.fetch_order_book(symbol, limit)
                return {
                    'bids': order_book['bids'],
                    'asks': order_book['asks'],
                    'timestamp': order_book['timestamp']
                }
            except Exception as e:
                self.logger.warning(f"Attempt {attempt + 1} failed for {exchange_id} {symbol} order book: {str(e)}")
                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(RETRY_DELAY)
                else:
                    self.logger.error(f"Failed to get order book for {exchange_id} {symbol} after {MAX_RETRIES} attempts")
                    return None

    async def get_balance(self, exchange_id: str, currency: str) -> Optional[float]:
        """
        Get balance for a specific currency from an exchange
        
        Args:
            exchange_id: ID of the exchange
            currency: Currency code
            
        Returns:
            Balance amount or None if failed
        """
        exchange = self.exchanges.get(exchange_id)
        if not exchange:
            self.logger.error(f"Exchange {exchange_id} not found")
            return None

        for attempt in range(MAX_RETRIES):
            try:
                balance = await exchange.fetch_balance()
                return balance.get(currency, {}).get('free', 0.0)
            except Exception as e:
                self.logger.warning(f"Attempt {attempt + 1} failed to get {currency} balance on {exchange_id}: {str(e)}")
                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(RETRY_DELAY)
                else:
                    self.logger.error(f"Failed to get balance for {exchange_id} {currency} after {MAX_RETRIES} attempts")
                    return None

    async def place_order(self, exchange_id: str, symbol: str, order_type: str, side: str, amount: float, price: Optional[float] = None) -> Optional[Dict]:
        """
        Place an order on an exchange
        
        Args:
            exchange_id: ID of the exchange
            symbol: Trading pair symbol
            order_type: Type of order ('limit' or 'market')
            side: Order side ('buy' or 'sell')
            amount: Order amount
            price: Order price (required for limit orders)
            
        Returns:
            Dictionary containing order details or None if failed
        """
        exchange = self.exchanges.get(exchange_id)
        if not exchange:
            self.logger.error(f"Exchange {exchange_id} not found")
            return None

        for attempt in range(MAX_RETRIES):
            try:
                if order_type == 'limit':
                    if price is None:
                        raise ValueError("Price is required for limit orders")
                    order = await exchange.create_limit_order(symbol, side, amount, price)
                else:
                    order = await exchange.create_market_order(symbol, side, amount)
                
                return {
                    'id': order['id'],
                    'symbol': order['symbol'],
                    'type': order['type'],
                    'side': order['side'],
                    'amount': order['amount'],
                    'price': order.get('price'),
                    'status': order['status'],
                    'timestamp': order['timestamp']
                }
            except Exception as e:
                self.logger.warning(f"Attempt {attempt + 1} failed to place order on {exchange_id}: {str(e)}")
                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(RETRY_DELAY)
                else:
                    self.logger.error(f"Failed to place order on {exchange_id} after {MAX_RETRIES} attempts")
                    return None

    def get_trading_fee(self, exchange_id: str) -> float:
        """
        Get trading fee for an exchange
        
        Args:
            exchange_id: ID of the exchange
            
        Returns:
            Trading fee as a percentage
        """
        return EXCHANGE_FEES.get(exchange_id, 0.0)

    async def close_connections(self):
        """Close all exchange connections"""
        for exchange_id, exchange in self.exchanges.items():
            try:
                await exchange.close()
                self.logger.info(f"Closed connection to {exchange_id}")
            except Exception as e:
                self.logger.error(f"Error closing connection to {exchange_id}: {str(e)}")
