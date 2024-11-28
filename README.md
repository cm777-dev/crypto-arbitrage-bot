# Crypto Arbitrage Bot

A real-time cryptocurrency arbitrage monitoring and trading platform built with React.

## Features

- Real-time price monitoring across multiple exchanges
- Arbitrage opportunity detection
- Backtesting system for strategy validation
- Interactive charts and analytics
- Performance metrics tracking
- Historical trade analysis

## Supported Exchanges

- Binance
- Coinbase
- Kraken

## Trading Pairs

- BTC/USDT
- ETH/USDT

## Tech Stack

- React 18
- Material-UI
- Recharts for data visualization
- Decimal.js for precise calculations
- WebSocket for real-time data
- Sentry for error tracking
- Google Analytics for usage tracking

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 10.x or later

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/crypto-arbitrage-bot.git
cd crypto-arbitrage-bot
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory and add your configuration:
```env
REACT_APP_SENTRY_DSN=your-sentry-dsn
REACT_APP_GA_MEASUREMENT_ID=your-ga-measurement-id
REACT_APP_CLARITY_ID=your-clarity-id
REACT_APP_API_URL=your-api-url
REACT_APP_WS_URL=your-websocket-url
```

4. Start the development server
```bash
npm start
```

### Building for Production

```bash
npm run build
```

## Testing

```bash
npm test
```

## Deployment

The project is configured for deployment on Vercel. Simply push to the main branch to trigger a deployment.

### Environment Variables

Make sure to configure the following environment variables in your Vercel project:

- `REACT_APP_SENTRY_DSN`
- `REACT_APP_GA_MEASUREMENT_ID`
- `REACT_APP_CLARITY_ID`
- `REACT_APP_API_URL`
- `REACT_APP_WS_URL`

## Features in Development

- Additional cryptocurrency pairs
- Live API integration
- Enhanced risk assessment
- Detailed reporting
- User-specific strategy configurations

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [React](https://reactjs.org/)
- [Material-UI](https://mui.com/)
- [Recharts](https://recharts.org/)
- [Vercel](https://vercel.com/)

## Contact

Your Name - [@yourusername](https://twitter.com/yourusername)

Project Link: [https://github.com/yourusername/crypto-arbitrage-bot](https://github.com/yourusername/crypto-arbitrage-bot)
