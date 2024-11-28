import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Button,
  Tooltip,
  IconButton,
  Collapse,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { validateArbitrageOpportunity } from '../utils/arbitrageCalculator';
import { useState } from 'react';

export default function OpportunityCard({ opportunity }) {
  const [expanded, setExpanded] = useState(false);

  const {
    grossProfit,
    netProfit,
    fees,
    adjustedProfit,
    slippage,
    transferTime,
    withinLimits,
    isViable,
    riskLevel
  } = validateArbitrageOpportunity({
    buyExchange: opportunity.buyExchange,
    sellExchange: opportunity.sellExchange,
    buyPrice: opportunity.buyPrice,
    sellPrice: opportunity.sellPrice,
    amount: 1, // Default to 1 unit for display
    pair: opportunity.pair,
    liquidity: 1000000 // Mock liquidity value
  });

  const getRiskColor = (level) => {
    switch (level) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div">
            {opportunity.pair}
          </Typography>
          <Chip
            label={riskLevel.toUpperCase()}
            color={getRiskColor(riskLevel)}
            size="small"
          />
        </Box>

        <Typography color="text.secondary" gutterBottom>
          Buy: {opportunity.buyExchange} @ ${opportunity.buyPrice.toFixed(2)}
        </Typography>
        <Typography color="text.secondary" gutterBottom>
          Sell: {opportunity.sellExchange} @ ${opportunity.sellPrice.toFixed(2)}
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Time Window Progress
          </Typography>
          <LinearProgress
            variant="determinate"
            value={opportunity.timeWindowProgress}
            sx={{ mt: 1, mb: 1 }}
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Typography variant="h6" color={adjustedProfit > 0 ? 'success.main' : 'error.main'}>
            ${adjustedProfit.toFixed(2)}
          </Typography>
          <Box>
            <Tooltip title="View Details">
              <IconButton
                size="small"
                onClick={() => setExpanded(!expanded)}
                sx={{
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s',
                }}
              >
                <ExpandMoreIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Gross Profit: ${grossProfit.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Total Fees: ${fees.totalFees.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Estimated Slippage: {slippage.toFixed(2)}%
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Transfer Time: ~{transferTime} minutes
            </Typography>
            {!withinLimits && (
              <Typography variant="body2" color="error" gutterBottom>
                Trade amount outside exchange limits
              </Typography>
            )}
          </Box>
        </Collapse>

        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            fullWidth
            disabled={!isViable}
            color={isViable ? 'primary' : 'error'}
          >
            {isViable ? 'Execute Trade' : 'Not Viable'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
