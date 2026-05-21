import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { energyService } from '../services/energyService';
import { useAuth } from './useAuth';

export const useEnergyData = () => {
  const { user } = useAuth();
  const [energyStatus, setEnergyStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastEnergySignature = useRef('');

  // Sync state and clear energyStatus instantly on logout
  useEffect(() => {
    if (!user) {
      setEnergyStatus(null);
      setLoading(false);
    }
  }, [user]);

  const getEnergySignature = useCallback((status) => {
    if (!status) return 'none';

    return JSON.stringify({
      energy: status.energy ?? 0,
      energyResetAt: status.energyResetAt ?? null,
      restoreInMs: status.restoreInMs ?? null,
      timeToNextRestore: status.timeToNextRestore ?? null,
      isInfinite: !!status.isInfinite,
    });
  }, []);

  const refreshEnergyStatus = useCallback(async (showLoading = false) => {
    if (!user) return null;
    try {
      if (showLoading) {
        setLoading(true);
      }

      const status = await energyService.getEnergyStatus();
      const nextSignature = getEnergySignature(status);

      if (nextSignature !== lastEnergySignature.current) {
        lastEnergySignature.current = nextSignature;
        setEnergyStatus(status);
      }

      setError(null);
      return status;
    } catch (err) {
      console.error('Failed to refresh energy status:', err);
      setError(err.message || 'Failed to load energy status');
      return null;
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [getEnergySignature, user]);

  const loadEnergyStatus = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return null;
    }
    return refreshEnergyStatus(true);
  }, [refreshEnergyStatus, user]);

  useEffect(() => {
    if (!user) return;
    loadEnergyStatus();
  }, [loadEnergyStatus, user]);

  useEffect(() => {
    if (!user) return;
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        refreshEnergyStatus(false);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [refreshEnergyStatus, user]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      refreshEnergyStatus(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [refreshEnergyStatus, user]);

  return {
    energyStatus,
    loading,
    error,
    loadEnergyStatus,
    refreshEnergyStatus,
  };
};

export default useEnergyData;
