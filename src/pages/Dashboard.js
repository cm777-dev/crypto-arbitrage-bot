import React, { useState, useEffect } from 'react';
import { Grid, Box } from '@mui/material';
import { useArbitrage } from '../hooks/useArbitrage';
import { mockPriceData } from '../utils/mockData';
import MonitoringControl from '../components/MonitoringControl';
import PriceChart from '../components/PriceChart';
import ExchangeStats from '../components/ExchangeStats';
import OpportunityCard from '../components/OpportunityCard';

export default function Dashboard() {
  const {
    opportunities,
    isMonitoring,
    error,
    startMonitoring,
    stopMonitoring,
  } = useArbitrage({
    interval: 10000,
    minProfitThreshold: 50,
    maxTradeAmount: 10000,
  });

  const [priceHistory, setPriceHistory] = useState(mockPriceData);

  // Mock exchange statistics
  const exchangeStats = {
    binance: {
      status: 'online',
      volume24h: 1250000000,
      lastUpdate: Date.now(),
    },
    coinbase: {
      status: 'online',
      volume24h: 980000000,
      lastUpdate: Date.now(),
    },
    kraken: {
      status: 'online',
      volume24h: 750000000,
      lastUpdate: Date.now(),
    },
  };

  // Update price history periodically
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      const newPrice = {
        timestamp: Date.now(),
        binance: 35000 + Math.random() * 1000,
        coinbase: 35100 + Math.random() * 1000,
        kraken: 34900 + Math.random() * 1000,
      };

      setPriceHistory((prev) => [...prev.slice(-23), newPrice]);
    }, 10000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Monitoring Control */}
        <Grid item xs={12}>
          <MonitoringControl
            isMonitoring={isMonitoring}
            onStart={startMonitoring}
            onStop={stopMonitoring}
            error={error}
            opportunities={opportunities}
          />
        </Grid>

        {/* Price Chart */}
        <Grid item xs={12}>
          <PriceChart data={priceHistory} pair="BTC/USD" />
        </Grid>

        {/* Exchange Stats */}
        <Grid item xs={12} md={4}>
          <ExchangeStats exchange="Binance" stats={exchangeStats.binance} />
        </Grid>
        <Grid item xs={12} md={4}>
          <ExchangeStats exchange="Coinbase" stats={exchangeStats.coinbase} />
        </Grid>
        <Grid item xs={12} md={4}>
          <ExchangeStats exchange="Kraken" stats={exchangeStats.kraken} />
        </Grid>

        {/* Active Opportunities */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            {opportunities.map((opportunity) => (
              <Grid item xs={12} sm={6} md={4} key={opportunity.id}>
                <OpportunityCard opportunity={opportunity} />
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
