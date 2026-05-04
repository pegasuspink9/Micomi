import { useState, useEffect, useCallback } from 'react';
import { dailyRewardService } from '../services/dailyRewardService';

export const useDailyReward = () => {
  const [dailyReward, setDailyReward] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState(null);

  const fetchDailyReward = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dailyRewardService.getDailyReward();
      setDailyReward(data);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to fetch daily reward');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const claimDailyReward = useCallback(async (rewardId) => {
    if (!rewardId) {
      return { success: false, error: 'Missing reward id' };
    }

    try {
      setClaiming(true);
      const response = await dailyRewardService.claimDailyReward(rewardId);
      await fetchDailyReward();
      return response;
    } catch (err) {
      return { success: false, error: err.message || 'Failed to claim daily reward' };
    } finally {
      setClaiming(false);
    }
  }, [fetchDailyReward]);

  useEffect(() => {
    fetchDailyReward();
  }, [fetchDailyReward]);

  return {
    dailyReward,
    loading,
    claiming,
    error,
    fetchDailyReward,
    claimDailyReward,
  };
};

export default useDailyReward;
