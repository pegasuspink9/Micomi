import { useState, useEffect } from 'react';
import { levelService } from '../services/levelService';

export const useLevelData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get level by ID
  const getLevelById = async (levelId) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🎮 Fetching level data for level ${levelId}`);
      const response = await levelService.getLevelById(levelId);
      
      if (!response) {
        throw new Error('No level data received');
      }
      
      console.log('📊 Level data response:', response);
      return { success: true, data: response };
      
    } catch (err) {
      console.error('❌ Error fetching level data:', err);
      setError(err.message || 'Failed to fetch level data');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Get level preview
  const getLevelPreview = async (levelId, playerId = 11) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🎮 Fetching level preview for level ${levelId}`);
      const response = await levelService.getLevelPreview(levelId);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch level preview');
      }
      
      console.log('📊 Level preview response:', response);
      return response;
      
    } catch (err) {
      console.error('❌ Error fetching level preview:', err);
      setError(err.message || 'Failed to fetch level preview');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Get levels by map ID
  const getLevelsByMapId = async (mapId) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🗺️ Fetching levels for map ${mapId}`);
      const response = await levelService.getLevelsByMapId(mapId);
      
      if (!response) {
        throw new Error('No levels data received');
      }
      
      console.log('📊 Levels data response:', response);
      return { success: true, data: response };
      
    } catch (err) {
      console.error('❌ Error fetching levels data:', err);
      setError(err.message || 'Failed to fetch levels data');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    loading,
    error,
    getLevelById,
    getLevelPreview,
    getLevelsByMapId,
    clearError
  };
};