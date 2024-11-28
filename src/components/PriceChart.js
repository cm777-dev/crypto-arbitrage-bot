import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
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

export default function PriceChart({ data = [], pair }) {
  const theme = useTheme();

  const formatXAxis = (timestamp) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  const formatTooltip = (value, name) => {
    return [`$${value.toFixed(2)}`, name];
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {pair} Price Comparison
        </Typography>
        <Box sx={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={theme.palette.divider}
              />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatXAxis}
                stroke={theme.palette.text.secondary}
              />
              <YAxis
                stroke={theme.palette.text.secondary}
                domain={['auto', 'auto']}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip
                formatter={formatTooltip}
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                }}
                labelFormatter={(timestamp) =>
                  format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss')
                }
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="binance"
                stroke={theme.palette.primary.main}
                dot={false}
                name="Binance"
              />
              <Line
                type="monotone"
                dataKey="coinbase"
                stroke={theme.palette.secondary.main}
                dot={false}
                name="Coinbase"
              />
              <Line
                type="monotone"
                dataKey="kraken"
                stroke={theme.palette.error.main}
                dot={false}
                name="Kraken"
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}
