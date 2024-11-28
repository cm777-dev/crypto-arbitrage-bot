import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Chip,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

export default function BacktestResults({ results }) {
  const {
    summary,
    trades,
    config
  } = results;

  // Calculate cumulative profit data for chart
  const profitData = trades.map((trade, index) => {
    const cumulativeProfit = trades
      .slice(0, index + 1)
      .reduce((sum, t) => sum + t.profit, 0);
    return {
      timestamp: trade.timestamp,
      profit: cumulativeProfit,
    };
  });

  return (
    <Grid container spacing={3}>
      {/* Summary Cards */}
      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Profit
                </Typography>
                <Typography variant="h4" component="div" color={summary.totalProfit >= 0 ? 'primary' : 'error'}>
                  ${summary.totalProfit.toFixed(2)}
                </Typography>
                <Typography color="textSecondary">
                  {((summary.totalProfit / summary.initialBalance) * 100).toFixed(2)}% return
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Win Rate
                </Typography>
                <Typography variant="h4" component="div">
                  {summary.winRate.toFixed(2)}%
                </Typography>
                <Typography color="textSecondary">
                  {summary.successfulTrades} / {summary.totalTrades} trades
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Profit Factor
                </Typography>
                <Typography variant="h4" component="div">
                  {summary.profitFactor.toFixed(2)}
                </Typography>
                <Typography color="textSecondary">
                  Win/Loss Ratio
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Max Drawdown
                </Typography>
                <Typography variant="h4" component="div" color="error">
                  {summary.maxDrawdown.toFixed(2)}%
                </Typography>
                <Typography color="textSecondary">
                  Risk Measure
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>

      {/* Profit Chart */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Cumulative Profit
            </Typography>
            <Box sx={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <LineChart
                  data={profitData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(timestamp) => format(new Date(timestamp), 'MM/dd HH:mm')}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(timestamp) =>
                      format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss')
                    }
                    formatter={(value) => ['$' + value.toFixed(2), 'Profit']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="#8884d8"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Trade History */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Trade History
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>Buy Exchange</TableCell>
                    <TableCell>Sell Exchange</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Buy Price</TableCell>
                    <TableCell align="right">Sell Price</TableCell>
                    <TableCell align="right">Fees</TableCell>
                    <TableCell align="right">Profit</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trades.map((trade, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {format(new Date(trade.timestamp), 'MM/dd HH:mm:ss')}
                      </TableCell>
                      <TableCell>{trade.buyExchange}</TableCell>
                      <TableCell>{trade.sellExchange}</TableCell>
                      <TableCell align="right">${trade.amount.toFixed(2)}</TableCell>
                      <TableCell align="right">${trade.buyPrice.toFixed(2)}</TableCell>
                      <TableCell align="right">${trade.sellPrice.toFixed(2)}</TableCell>
                      <TableCell align="right">${trade.fees.toFixed(2)}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`$${trade.profit.toFixed(2)}`}
                          color={trade.profit >= 0 ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Backtest Configuration */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Backtest Configuration
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography color="textSecondary" gutterBottom>
                  Start Date
                </Typography>
                <Typography variant="body1">
                  {format(new Date(config.startDate), 'yyyy-MM-dd')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography color="textSecondary" gutterBottom>
                  End Date
                </Typography>
                <Typography variant="body1">
                  {format(new Date(config.endDate), 'yyyy-MM-dd')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography color="textSecondary" gutterBottom>
                  Min Profit Threshold
                </Typography>
                <Typography variant="body1">
                  ${config.minProfitThreshold}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography color="textSecondary" gutterBottom>
                  Max Trade Amount
                </Typography>
                <Typography variant="body1">
                  ${config.maxTradeAmount}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
