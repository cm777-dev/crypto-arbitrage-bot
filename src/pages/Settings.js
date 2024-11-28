import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Grid,
  Divider,
  Alert,
} from '@mui/material';
import { exchangeFees } from '../utils/mockData';

export default function Settings() {
  const [settings, setSettings] = useState({
    minProfitThreshold: '50',
    maxTradeAmount: '10000',
    autoTrade: false,
    notifications: true,
    apiKeys: {
      binance: '',
      coinbase: '',
      kraken: '',
    },
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (event) => {
    const { name, value, checked } = event.target;
    if (name === 'autoTrade' || name === 'notifications') {
      setSettings((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else if (name.startsWith('apiKey_')) {
      const exchange = name.split('_')[1];
      setSettings((prev) => ({
        ...prev,
        apiKeys: {
          ...prev.apiKeys,
          [exchange]: value,
        },
      }));
    } else {
      setSettings((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSave = () => {
    // In a real app, this would save to backend/localStorage
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      {saved && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Settings saved successfully!
        </Alert>
      )}

      {/* Trading Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Trading Settings
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Minimum Profit Threshold ($)"
                name="minProfitThreshold"
                type="number"
                value={settings.minProfitThreshold}
                onChange={handleChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Maximum Trade Amount ($)"
                name="maxTradeAmount"
                type="number"
                value={settings.maxTradeAmount}
                onChange={handleChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoTrade}
                    onChange={handleChange}
                    name="autoTrade"
                  />
                }
                label="Enable Auto-Trading"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications}
                    onChange={handleChange}
                    name="notifications"
                  />
                }
                label="Enable Notifications"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Exchange API Keys */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Exchange API Keys
          </Typography>
          <Grid container spacing={3}>
            {Object.keys(exchangeFees).map((exchange) => (
              <Grid item xs={12} key={exchange}>
                <TextField
                  fullWidth
                  label={`${exchange.charAt(0).toUpperCase() + exchange.slice(1)} API Key`}
                  name={`apiKey_${exchange}`}
                  type="password"
                  value={settings.apiKeys[exchange]}
                  onChange={handleChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Exchange Fees Information */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Exchange Fees
          </Typography>
          <Grid container spacing={3}>
            {Object.entries(exchangeFees).map(([exchange, fees]) => (
              <Grid item xs={12} sm={4} key={exchange}>
                <Typography variant="subtitle1" gutterBottom>
                  {exchange.charAt(0).toUpperCase() + exchange.slice(1)}
                </Typography>
                <Typography variant="body2">
                  Maker Fee: {fees.maker * 100}%
                </Typography>
                <Typography variant="body2">
                  Taker Fee: {fees.taker * 100}%
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2">Withdrawal Fees:</Typography>
                {Object.entries(fees.withdrawal).map(([currency, fee]) => (
                  <Typography key={currency} variant="body2">
                    {currency}: {fee}
                  </Typography>
                ))}
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" color="primary" onClick={handleSave}>
          Save Settings
        </Button>
      </Box>
    </Box>
  );
}
