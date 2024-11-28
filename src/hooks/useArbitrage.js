import { useState, useEffect, useCallback } from 'react';
import { arbitrageService } from '../services/arbitrageService';

export function useArbitrage(config = {}) {
  const [opportunities, setOpportunities] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState(null);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    try {
      arbitrageService.startMonitoring(config);
      setIsMonitoring(true);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [config]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    try {
      arbitrageService.stopMonitoring();
      setIsMonitoring(false);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Update opportunities
  useEffect(() => {
    if (!isMonitoring) return;

    const updateOpportunities = () => {
      try {
        const currentOpportunities = arbitrageService.getOpportunities();
        setOpportunities(currentOpportunities);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    };

    // Initial update
    updateOpportunities();

    // Set up interval for updates
    const interval = setInterval(updateOpportunities, 1000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  // Execute trade
  const executeTrade = useCallback(async (opportunity) => {
    try {
      const result = await arbitrageService.executeTrade(opportunity);
      setError(null);
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  return {
    opportunities,
    isMonitoring,
    error,
    startMonitoring,
    stopMonitoring,
    executeTrade,
  };
}
