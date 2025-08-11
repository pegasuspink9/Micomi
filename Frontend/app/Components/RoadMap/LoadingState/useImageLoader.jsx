import { useState, useEffect, useCallback, useRef } from 'react';
import { Image } from 'react-native';

export const useImageLoader = (uris = [], mapName = '') => {
  const [loadingStates, setLoadingStates] = useState({});
  const [allLoaded, setAllLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [failedUris, setFailedUris] = useState([]);
  const [retryCount, setRetryCount] = useState(0);
  const [currentMap, setCurrentMap] = useState(mapName);
  
  // Use refs to avoid dependency issues
  const urisRef = useRef(uris);
  const loadingRef = useRef(false);
  const retryTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Cache for loaded maps to avoid reloading
  const loadedMapsRef = useRef(new Set());

  // Update refs when props change
  useEffect(() => {
    urisRef.current = uris;
  }, [uris]);

  // Enhanced preloading for GitHub assets
  const preloadImage = useCallback((uri, retryAttempt = 0) => {
    return new Promise((resolve) => {
      if (!uri) {
        resolve({ uri, success: false, error: 'No URI provided' });
        return;
      }

      // Check if we should abort (map changed)
      if (abortControllerRef.current?.signal.aborted) {
        resolve({ uri, success: false, error: 'Aborted - map changed' });
        return;
      }

      // GitHub assets often need longer timeout
      const timeoutDuration = uri.includes('github.com') || uri.includes('lottie.host') ? 20000 : 15000;
      
      const imageLoad = Image.prefetch(uri);

      const timeout = setTimeout(() => {
        console.warn(`⏰ Timeout loading asset for ${mapName}: ${uri.substring(0, 50)}...`);
        resolve({ uri, success: false, error: 'Timeout', retryAttempt });
      }, timeoutDuration);

      imageLoad
        .then(() => {
          clearTimeout(timeout);
          if (!abortControllerRef.current?.signal.aborted) {
            console.log(`✅ Loaded asset for ${mapName}: ${uri.substring(0, 50)}...`);
            resolve({ uri, success: true, retryAttempt });
          }
        })
        .catch((error) => {
          clearTimeout(timeout);
          if (!abortControllerRef.current?.signal.aborted) {
            console.warn(`❌ Failed asset for ${mapName}: ${uri.substring(0, 50)}..., Error: ${error.message}`);
            resolve({ uri, success: false, error: error.message, retryAttempt });
          }
        });
    });
  }, [mapName]);

  const loadAllImages = useCallback(async (isRetry = false, currentFailedUris = []) => {
    const currentUris = urisRef.current;
    
    // If this map is already loaded and we're not retrying, skip
    if (loadedMapsRef.current.has(mapName) && !isRetry) {
      setAllLoaded(true);
      setLoadingProgress(100);
      console.log(`🎯 Map "${mapName}" already loaded from cache`);
      return;
    }
    
    if (currentUris.length === 0) {
      setAllLoaded(true);
      loadedMapsRef.current.add(mapName);
      console.log(`✨ No assets to load for map "${mapName}"`);
      return;
    }

    // Prevent multiple simultaneous loading attempts
    if (loadingRef.current && !isRetry) {
      return;
    }
    loadingRef.current = true;

    // Create abort controller for this loading session
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    if (!isRetry) {
      setLoadingStates({});
      setLoadingProgress(0);
      setFailedUris([]);
      setRetryCount(0);
      console.log(`🚀 Loading ${currentUris.length} assets for map "${mapName}"...`);
    }

    const urisToLoad = isRetry ? currentFailedUris : currentUris;
    let successfulLoads = 0;
    let newFailedUris = [];

    // Load GitHub assets with batch processing for better performance
    const batchSize = 2; // Smaller batch size for focused loading
    
    for (let i = 0; i < urisToLoad.length; i += batchSize) {
      // Check if loading was aborted (map changed)
      if (abortControllerRef.current?.signal.aborted) {
        console.log(`🛑 Loading aborted for map "${mapName}" - map changed`);
        loadingRef.current = false;
        return;
      }

      const batch = urisToLoad.slice(i, i + batchSize);
      
      const batchPromises = batch.map(uri => preloadImage(uri, retryCount));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, batchIndex) => {
        const uri = batch[batchIndex];
        const resultValue = result.status === 'fulfilled' ? result.value : { uri, success: false, error: 'Promise rejected' };
        
        // Only update state if not aborted
        if (!abortControllerRef.current?.signal.aborted) {
          setLoadingStates(prev => ({
            ...prev,
            [uri]: resultValue
          }));

          if (resultValue.success) {
            successfulLoads++;
          } else {
            newFailedUris.push(uri);
          }

          // Update progress based on total URIs for this map only
          const currentProgress = ((i + batchIndex + 1) / currentUris.length) * 100;
          setLoadingProgress(Math.min(currentProgress, 100));
        }
      });

      // Smaller delay for focused loading
      if (i + batchSize < urisToLoad.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    // Check if aborted before proceeding
    if (abortControllerRef.current?.signal.aborted) {
      console.log(`🛑 Loading completed but aborted for map "${mapName}"`);
      loadingRef.current = false;
      return;
    }

    console.log(`📊 Completed loading for "${mapName}": ${successfulLoads}/${urisToLoad.length} assets${isRetry ? ' (retry)' : ''}`);

    // Handle retry logic
    if (newFailedUris.length > 0 && retryCount < 3) { // Reduced retry count for faster loading
      setFailedUris(newFailedUris);
      setRetryCount(prev => prev + 1);
      
      // Shorter retry delay for focused loading
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 8000);
      
      console.log(`🔄 Retrying ${newFailedUris.length} failed assets for "${mapName}" (attempt ${retryCount + 1}/3) in ${retryDelay/1000}s...`);
      
      // Clear any existing timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      retryTimeoutRef.current = setTimeout(() => {
        loadAllImages(true, newFailedUris);
      }, retryDelay);
      
      return;
    }

    // Check if all images loaded successfully
    if (newFailedUris.length === 0) {
      setAllLoaded(true);
      setLoadingProgress(100);
      loadingRef.current = false;
      loadedMapsRef.current.add(mapName); // Cache this map as loaded
      console.log(`🎉 All assets loaded successfully for map "${mapName}"!`);
    } else {
      // Handle final failure case
      console.error(`💥 Failed to load ${newFailedUris.length} assets for "${mapName}" after ${retryCount} retries.`);
      console.error('Failed assets:', newFailedUris);
      
      // For focused loading, proceed anyway after reasonable attempts
      setAllLoaded(true);
      setLoadingProgress(100);
      loadingRef.current = false;
      loadedMapsRef.current.add(mapName);
      console.log(`⚠️ Proceeding with partial loading for map "${mapName}"`);
    }
  }, [preloadImage, retryCount, mapName]);

  // Reset states when map changes
  useEffect(() => {
    // If map changed, abort current loading
    if (currentMap !== mapName) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Clear any pending timeouts
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      
      setCurrentMap(mapName);
      loadingRef.current = false;
    }

    // Check if this map is already loaded
    if (loadedMapsRef.current.has(mapName) && uris.length > 0) {
      setAllLoaded(true);
      setLoadingProgress(100);
      console.log(`🎯 Map "${mapName}" loaded from cache`);
      return;
    }
    
    setAllLoaded(false);
    setLoadingStates({});
    setLoadingProgress(0);
    setFailedUris([]);
    setRetryCount(0);
    
    // Start loading with a small delay to ensure state is reset
    const timeoutId = setTimeout(() => {
      loadAllImages(false);
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [mapName, uris]); // Include mapName in dependencies

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      loadingRef.current = false;
    };
  }, []);

  const reload = useCallback(() => {
    // Remove from cache and reload
    loadedMapsRef.current.delete(mapName);
    
    // Abort current loading
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Clear any pending timeouts
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    setRetryCount(0);
    setFailedUris([]);
    setAllLoaded(false);
    setLoadingProgress(0);
    loadingRef.current = false;
    
    console.log(`🔄 Manually reloading assets for map "${mapName}"`);
    
    setTimeout(() => {
      loadAllImages(false);
    }, 100);
  }, [loadAllImages, mapName]);

  // Clear cache function for development
  const clearCache = useCallback(() => {
    loadedMapsRef.current.clear();
    console.log('🗑️ Cleared all map loading cache');
  }, []);

  return {
    loadingStates,
    allLoaded,
    loadingProgress,
    failedUris,
    retryCount,
    reload,
    clearCache, // For development/debugging
    isLoadingMap: mapName,
    cachedMaps: Array.from(loadedMapsRef.current)
  };
};