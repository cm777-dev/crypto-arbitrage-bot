import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';

export default function MonitoringControl({
  isMonitoring,
  onStart,
  onStop,
  error,
  opportunities = [],
}) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div">
            Monitoring Status
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isMonitoring && (
              <CircularProgress
                size={20}
                sx={{ mr: 2 }}
              />
            )}
            <Button
              variant="contained"
              color={isMonitoring ? 'error' : 'primary'}
              onClick={isMonitoring ? onStop : onStart}
              startIcon={isMonitoring ? <StopIcon /> : <PlayArrowIcon />}
            >
              {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Status
            </Typography>
            <Typography variant="body1">
              {isMonitoring ? 'Active' : 'Inactive'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Active Opportunities
            </Typography>
            <Typography variant="body1">
              {opportunities.length}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Last Update
            </Typography>
            <Typography variant="body1">
              {opportunities.length > 0
                ? new Date(
                    Math.max(...opportunities.map((o) => o.timestamp))
                  ).toLocaleTimeString()
                : 'N/A'}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
