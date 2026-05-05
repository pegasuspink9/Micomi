import { useSyncExternalStore } from 'react';

let isOffline = false;
const listeners = new Set();

const notify = () => {
  listeners.forEach((listener) => listener());
};

export const connectivityStore = {
  getSnapshot: () => isOffline,
  subscribe: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setOffline: (nextValue) => {
    if (isOffline === nextValue) return;
    isOffline = nextValue;
    notify();
  },
};

export const useConnectivity = () =>
  useSyncExternalStore(connectivityStore.subscribe, connectivityStore.getSnapshot);