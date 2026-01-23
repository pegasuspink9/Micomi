import { useState, useEffect } from 'react';
import { levelService } from '../services/levelService';
import { universalAssetPreloader } from '../services/preloader/universalAssetPreloader';

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
  const getLevelPreview = async (levelId) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🎮 Fetching level preview for level ${levelId}`);

      await universalAssetPreloader.loadCachedAssets('game_animations');
      await universalAssetPreloader.loadCachedAssets('game_images');
      await universalAssetPreloader.loadCachedAssets('map_assets');
      
      const response = await levelService.getLevelPreview(levelId);

      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch level preview');
      }
      
      console.log('📊 Level preview response:', response);
      
      const transformedData = transformLevelPreviewWithCache(response.data);
      
      return { ...response, data: transformedData };
      
    } catch (err) {
      console.error('❌ Error fetching level preview:', err);
      setError(err.message || 'Failed to fetch level preview');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const transformLevelPreviewWithCache = (previewData) => {
    if (!previewData) return previewData;

    const transformed = { ...previewData };

    // Transform enemy avatar
    if (transformed.enemy?.enemy_avatar) {
      const cachedPath = universalAssetPreloader.getCachedAssetPath(transformed.enemy.enemy_avatar);
      if (cachedPath !== transformed.enemy.enemy_avatar) {
        console.log(`📦 Using cached enemy avatar: ${transformed.enemy.enemy_avatar.slice(-30)}`);
        transformed.enemy = {
          ...transformed.enemy,
          enemy_avatar: cachedPath
        };
      }
    }

    // Transform character avatar
    if (transformed.character?.character_avatar) {
      const cachedPath = universalAssetPreloader.getCachedAssetPath(transformed.character.character_avatar);
      if (cachedPath !== transformed.character.character_avatar) {
        console.log(`📦 Using cached character avatar: ${transformed.character.character_avatar.slice(-30)}`);
        transformed.character = {
          ...transformed.character,
          character_avatar: cachedPath
        };
      }
    }

    return transformed;
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

  const buyPotion = async (levelId, potionId) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🛒 Buying potion ${potionId} in level ${levelId}`);
      const response = await levelService.buyPotion(levelId, potionId);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to buy potion');
      }
      
      console.log('🛒 Potion purchase response:', response);
      return response;
      
    } catch (err) {
      console.error('❌ Error buying potion:', err);
      setError(err.message || 'Failed to buy potion');
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
    clearError,
    buyPotion
  };
};