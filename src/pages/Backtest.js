import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import BacktestService from '../services/backtestService';
import BacktestResults from '../components/BacktestResults';
import { mockHistoricalData } from '../utils/mockData';

export default function Backtest() {
  const [config, setConfig] = useState({
    startDate: new Date('2023-01-01'),
    endDate: new Date(),
    initialBalance: 10000,
    minProfitThreshold: 50,
    maxTradeAmount: 10000,
  });

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConfigChange = (field) => (event) => {
    const value = event.target.value;
    setConfig((prev) => ({
      ...prev,
      [field]: field === 'startDate' || field === 'endDate' ? event : Number(value),
    }));
  };

  const runBacktest = async () => {
    setLoading(true);
    setError(null);
    try {
      const backtestService = new BacktestService(config);
      const backtestResults = await backtestService.runBacktest(mockHistoricalData);
      setResults(backtestResults);
    } catch (err) {
      setError(err.message);
      console.error('Backtest error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Strategy Backtesting
        </Typography>

        {/* Configuration Form */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Backtest Configuration
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <DatePicker
                  label="Start Date"
                  value={config.startDate}
                  onChange={(newValue) => handleConfigChange('startDate')(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <DatePicker
                  label="End Date"
                  value={config.endDate}
                  onChange={(newValue) => handleConfigChange('endDate')(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Initial Balance (USD)"
                  type="number"
                  value={config.initialBalance}
                  onChange={handleConfigChange('initialBalance')}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Min Profit Threshold (USD)"
                  type="number"
                  value={config.minProfitThreshold}
                  onChange={handleConfigChange('minProfitThreshold')}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Max Trade Amount (USD)"
                  type="number"
                  value={config.maxTradeAmount}
                  onChange={handleConfigChange('maxTradeAmount')}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={runBacktest}
                  disabled={loading}
                  sx={{ mr: 2 }}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={24} sx={{ mr: 1 }} />
                      Running Backtest...
                    </>
                  ) : (
                    'Run Backtest'
                  )}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            Error: {error}
          </Typography>
        )}

        {/* Results Display */}
        {results && <BacktestResults results={results} />}
      </Box>
    </LocalizationProvider>
  );
}
