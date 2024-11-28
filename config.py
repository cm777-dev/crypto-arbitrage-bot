import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Exchange API credentials
BINANCE_API_KEY = os.getenv('BINANCE_API_KEY')
BINANCE_SECRET_KEY = os.getenv('BINANCE_SECRET_KEY')
COINBASE_API_KEY = os.getenv('COINBASE_API_KEY')
COINBASE_SECRET_KEY = os.getenv('COINBASE_SECRET_KEY')
KRAKEN_API_KEY = os.getenv('KRAKEN_API_KEY')
KRAKEN_SECRET_KEY = os.getenv('KRAKEN_SECRET_KEY')

# Trading parameters
TRADING_PAIRS = [
    'BTC/USDT',
    'ETH/USDT',
    'BNB/USDT',
    'XRP/USDT',
    'ADA/USDT'
]

EXCHANGES = [
    'binance',
    'coinbase',
    'kraken'
]

# Minimum profit threshold for arbitrage (in percentage)
MIN_PROFIT_THRESHOLD = 0.5

# Maximum trade amount in USDT
MAX_TRADE_AMOUNT = 1000

# Trading fees for each exchange (in percentage)
EXCHANGE_FEES = {
    'binance': 0.1,
    'coinbase': 0.5,
    'kraken': 0.26
}

# Time interval for price checks (in seconds)
CHECK_INTERVAL = 5

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'database': 'crypto_arbitrage',
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD')
}

# Logging configuration
LOG_CONFIG = {
    'filename': 'arbitrage_bot.log',
    'level': 'INFO',
    'format': '%(asctime)s - %(levelname)s - %(message)s'
}

# Telegram notification settings
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
TELEGRAM_CHAT_ID = os.getenv('TELEGRAM_CHAT_ID')

# Risk management
MAX_CONCURRENT_TRADES = 3
STOP_LOSS_PERCENTAGE = 1.0
TAKE_PROFIT_PERCENTAGE = 2.0

# Network settings
REQUEST_TIMEOUT = 30
MAX_RETRIES = 3
RETRY_DELAY = 5
