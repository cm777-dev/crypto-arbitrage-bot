import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Chip,
  Tooltip,
  IconButton,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { exchangeFees } from '../utils/mockData';

export default function ExchangeStats({ exchange, stats }) {
  const fees = exchangeFees[exchange.toLowerCase()];

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'success';
      case 'delayed':
        return 'warning';
      case 'offline':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div">
            {exchange}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={stats.status}
              color={getStatusColor(stats.status)}
              size="small"
            />
            <Tooltip title="Exchange Information">
              <IconButton size="small">
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              24h Volume
            </Typography>
            <Typography variant="body1">
              ${stats.volume24h.toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Last Update
            </Typography>
            <Typography variant="body1">
              {new Date(stats.lastUpdate).toLocaleTimeString()}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Maker Fee
            </Typography>
            <Typography variant="body1">
              {(fees.maker * 100).toFixed(2)}%
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Taker Fee
            </Typography>
            <Typography variant="body1">
              {(fees.taker * 100).toFixed(2)}%
            </Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Withdrawal Fees
          </Typography>
          <Grid container spacing={1}>
            {Object.entries(fees.withdrawal).map(([currency, fee]) => (
              <Grid item xs={4} key={currency}>
                <Tooltip title={`${currency} withdrawal fee`}>
                  <Chip
                    label={`${currency}: ${fee}`}
                    size="small"
                    variant="outlined"
                  />
                </Tooltip>
              </Grid>
            ))}
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
}
