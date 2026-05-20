import React, { useEffect, useRef } from 'react';
import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';
import { useEnergyData } from '../../hooks/useEnergyData';

const shouldDisableNotifications = isRunningInExpoGo() && Platform.OS === 'android';

let Notifications = null;
if (!shouldDisableNotifications) {
  try {
    Notifications = require('expo-notifications');
  } catch (error) {
    console.warn('⚠️ Failed to load expo-notifications in EnergyNotificationManager:', error);
  }
}

const NOTIFICATION_ID = 'micomi-energy-full';
const MAX_ENERGY = 100;
const ENERGY_RESTORE_INTERVAL = 60 * 60 * 1000; // 1 hour in ms
const ENERGY_RESTORE_AMOUNT = 25;

export default function EnergyNotificationManager() {
  const { energyStatus } = useEnergyData();
  const lastScheduledTimeRef = useRef(null);

  useEffect(() => {
    if (!Notifications) {
      if (energyStatus) {
        const currentEnergy = energyStatus.energy ?? 0;
        const isInfinite = !!energyStatus.isInfinite;
        const energyResetAt = energyStatus.energyResetAt;

        if (currentEnergy < MAX_ENERGY && !isInfinite && energyResetAt) {
          const resetTime = new Date(energyResetAt).getTime();
          const now = Date.now();
          if (resetTime > now) {
            const energyNeeded = MAX_ENERGY - currentEnergy;
            const ticksNeeded = Math.ceil(energyNeeded / ENERGY_RESTORE_AMOUNT);
            const targetTimestamp = resetTime + (ticksNeeded - 1) * ENERGY_RESTORE_INTERVAL;
            console.log(`[EnergyNotificationManager] (Expo Go Android Mock) Scheduled full energy notification for ${new Date(targetTimestamp).toString()}`);
          }
        }
      }
      return;
    }

    const manageEnergyNotification = async () => {
      try {
        if (!energyStatus) return;

        const currentEnergy = energyStatus.energy ?? 0;
        const isInfinite = !!energyStatus.isInfinite;
        const energyResetAt = energyStatus.energyResetAt;

        // If energy is already full or infinite, cancel any scheduled full notifications.
        if (currentEnergy >= MAX_ENERGY || isInfinite) {
          await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID);
          lastScheduledTimeRef.current = null;
          console.log('[EnergyNotificationManager] Energy is full or infinite. Cancelled scheduled notifications.');
          return;
        }

        if (!energyResetAt) return;

        // Request permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (finalStatus !== 'granted') {
          const { status: askStatus } = await Notifications.requestPermissionsAsync();
          finalStatus = askStatus;
        }

        if (finalStatus !== 'granted') {
          console.warn('[EnergyNotificationManager] Notification permission not granted');
          return;
        }

        // Calculate time when energy will reach exactly 100
        const resetTime = new Date(energyResetAt).getTime();
        const now = Date.now();

        if (resetTime <= now) return; // Reset time is in the past, wait for refresh

        const energyNeeded = MAX_ENERGY - currentEnergy;
        const ticksNeeded = Math.ceil(energyNeeded / ENERGY_RESTORE_AMOUNT);
        const targetTimestamp = resetTime + (ticksNeeded - 1) * ENERGY_RESTORE_INTERVAL;

        // Only schedule if the target time has changed significantly (more than 5 seconds difference)
        if (lastScheduledTimeRef.current && Math.abs(lastScheduledTimeRef.current - targetTimestamp) < 5000) {
          return;
        }

        // Cancel previous scheduled notification if any
        await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID);

        // Schedule new one
        await Notifications.scheduleNotificationAsync({
          identifier: NOTIFICATION_ID,
          content: {
            title: 'Energy is full',
            body: 'Come help Micomi fight the bugs and save the world from bugs',
            sound: true,
          },
          trigger: {
            date: new Date(targetTimestamp),
          },
        });

        lastScheduledTimeRef.current = targetTimestamp;
        console.log(`[EnergyNotificationManager] Scheduled full energy notification for ${new Date(targetTimestamp).toString()}`);
      } catch (error) {
        console.warn('⚠️ Failed to manage energy notification:', error);
      }
    };

    manageEnergyNotification();
  }, [energyStatus]);

  return null;
}
