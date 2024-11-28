import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import { mockOpportunities } from '../utils/mockData';
import OpportunityCard from '../components/OpportunityCard';

export default function Opportunities() {
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState([]);
  const [filters, setFilters] = useState({
    pair: 'all',
    exchange: 'all',
    minProfit: '',
  });

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      try {
        // In a real app, this would be an API call
        setOpportunities(mockOpportunities);
      } catch (error) {
        console.error('Error fetching opportunities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleFilterChange = (event) => {
    setFilters({
      ...filters,
      [event.target.name]: event.target.value,
    });
  };

  const filteredOpportunities = opportunities.filter((opp) => {
    if (filters.pair !== 'all' && opp.pair !== filters.pair) return false;
    if (
      filters.exchange !== 'all' &&
      opp.buyExchange !== filters.exchange &&
      opp.sellExchange !== filters.exchange
    )
      return false;
    if (
      filters.minProfit &&
      opp.potentialProfit < parseFloat(filters.minProfit)
    )
      return false;
    return true;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Arbitrage Opportunities
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Trading Pair</InputLabel>
                <Select
                  name="pair"
                  value={filters.pair}
                  label="Trading Pair"
                  onChange={handleFilterChange}
                >
                  <MenuItem value="all">All Pairs</MenuItem>
                  <MenuItem value="BTC/USD">BTC/USD</MenuItem>
                  <MenuItem value="ETH/USD">ETH/USD</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Exchange</InputLabel>
                <Select
                  name="exchange"
                  value={filters.exchange}
                  label="Exchange"
                  onChange={handleFilterChange}
                >
                  <MenuItem value="all">All Exchanges</MenuItem>
                  <MenuItem value="Binance">Binance</MenuItem>
                  <MenuItem value="Coinbase">Coinbase</MenuItem>
                  <MenuItem value="Kraken">Kraken</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Min. Profit ($)"
                name="minProfit"
                type="number"
                value={filters.minProfit}
                onChange={handleFilterChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Opportunities Grid */}
      <Grid container spacing={2}>
        {filteredOpportunities.map((opportunity) => (
          <Grid item xs={12} sm={6} md={4} key={opportunity.id}>
            <OpportunityCard opportunity={opportunity} />
          </Grid>
        ))}
        {filteredOpportunities.length === 0 && (
          <Grid item xs={12}>
            <Typography variant="body1" color="text.secondary" align="center">
              No opportunities found matching your criteria.
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
