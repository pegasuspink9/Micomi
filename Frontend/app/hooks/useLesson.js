import { useState, useEffect, useCallback } from 'react';
import { lessonService } from '../services/lessonService';

export const useLesson = () => {
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // New states for Course Topics
  const [topics, setTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicsError, setTopicsError] = useState(null);

  const [moduleContent, setModuleContent] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);


  const fetchLanguages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await lessonService.getModuleLanguages();
      setLanguages(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load module languages.');
    } finally {
      setLoading(false);
    }
  }, []);

  // New function to fetch module titles (Topics)
  const fetchTopics = useCallback(async (mapId) => {
    if (!mapId) return;
    try {
      setTopicsLoading(true);
      setTopicsError(null);
      const data = await lessonService.getModuleTitles(mapId);
      setTopics(data || []);
    } catch (err) {
      setTopicsError(err.message || 'Failed to load module titles.');
    } finally {
      setTopicsLoading(false);
    }
  }, []);

  
  const fetchModuleContent = useCallback(async (moduleId) => {
    if (!moduleId) return;
    try {
      setContentLoading(true);
      const data = await lessonService.getModuleContent(moduleId);
      setModuleContent(data);
    } catch (err) {
      console.error(err);
    } finally {
      setContentLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLanguages();
  }, [fetchLanguages]);

  return { 
    languages, 
    loading, 
    error, 
    refetch: fetchLanguages,
    
    // Export topic states & fetcher
    topics,
    topicsLoading,
    topicsError,
    fetchTopics,

    moduleContent,
    contentLoading,
    fetchModuleContent
  };
};