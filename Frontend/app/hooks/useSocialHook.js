import { useMemo } from 'react';
import { socialService } from '../services/socialService';

export const useSocialHook = () => {
  return useMemo(() => socialService, []);
};

export default useSocialHook;
