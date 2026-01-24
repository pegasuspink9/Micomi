import { useState, useEffect } from 'react';
import { leaderboardService } from '../services/leaderboardService';
import { Alert } from 'react-native';

export const useLeaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await leaderboardService.getLeaderboard();
        setLeaderboardData(data.leaderboard);
        setCurrentUserRank(data.currentUser);
      } catch (err) {
        setError(err);
        Alert.alert('Error', 'Failed to load leaderboard. Please try again later.');
        console.error('Error in useLeaderboard hook:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return { leaderboardData, currentUserRank, loading, error };
};