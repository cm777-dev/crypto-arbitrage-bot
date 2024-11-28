import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
} from '@mui/material';
import { format } from 'date-fns';

// Mock historical data
const mockHistoricalData = Array.from({ length: 50 }, (_, index) => ({
  id: index + 1,
  timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
  pair: Math.random() > 0.5 ? 'BTC/USD' : 'ETH/USD',
  buyExchange: ['Binance', 'Coinbase', 'Kraken'][Math.floor(Math.random() * 3)],
  sellExchange: ['Binance', 'Coinbase', 'Kraken'][Math.floor(Math.random() * 3)],
  buyPrice: Math.random() * 1000 + 34000,
  sellPrice: Math.random() * 1000 + 34500,
  profit: Math.random() * 200,
  status: ['executed', 'missed', 'failed'][Math.floor(Math.random() * 3)],
}));

export default function History() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'executed':
        return 'success';
      case 'missed':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Trading History
      </Typography>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Pair</TableCell>
                <TableCell>Buy Exchange</TableCell>
                <TableCell>Sell Exchange</TableCell>
                <TableCell align="right">Buy Price</TableCell>
                <TableCell align="right">Sell Price</TableCell>
                <TableCell align="right">Profit</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockHistoricalData
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      {format(row.timestamp, 'yyyy-MM-dd HH:mm:ss')}
                    </TableCell>
                    <TableCell>{row.pair}</TableCell>
                    <TableCell>{row.buyExchange}</TableCell>
                    <TableCell>{row.sellExchange}</TableCell>
                    <TableCell align="right">
                      ${row.buyPrice.toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      ${row.sellPrice.toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      ${row.profit.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.status}
                        color={getStatusColor(row.status)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={mockHistoricalData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
}
