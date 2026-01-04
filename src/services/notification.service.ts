import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_ENABLED_KEY = 'PRAYER_NOTIFICATIONS_ENABLED';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  async requestPermissions() {
    if (!Device.isDevice) {
      console.log('Notifications only work on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push notification permissions');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('prayer-times', {
        name: 'Namaz Vakitleri',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
      });
    }

    return true;
  },

  async schedulePrayerNotifications(prayerTimes: Record<string, string>) {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();

      const enabled = await AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY);
      if (enabled !== 'true') {
        return;
      }

      const now = new Date();
      const prayers = [
        { name: 'İmsak', time: prayerTimes.imsak },
        { name: 'Güneş', time: prayerTimes.gunes },
        { name: 'Öğle', time: prayerTimes.ogle },
        { name: 'İkindi', time: prayerTimes.ikindi },
        { name: 'Akşam', time: prayerTimes.aksam },
        { name: 'Yatsı', time: prayerTimes.yatsi },
      ];

      for (const prayer of prayers) {
        if (!prayer.time) continue;

        const [hours, minutes] = prayer.time.split(':').map(Number);

        const exactTime = new Date();
        exactTime.setHours(hours, minutes, 0, 0);

        if (exactTime > now) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `${prayer.name} Vakti Girdi 🕌`,
              body: `${prayer.name} namazı vakti girmiştir. Hayırlı namaz olsun.`,
              sound: 'default',
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: exactTime,
            },
          });
        }

        const thirtyMinBefore = new Date();
        thirtyMinBefore.setHours(hours, minutes - 30, 0, 0);

        if (thirtyMinBefore > now) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `${prayer.name} Vaktine 30 Dakika Kaldı ⏰`,
              body: `${prayer.name} namazı vaktine 30 dakika kaldı.`,
              sound: 'default',
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: thirtyMinBefore,
            },
          });
        }
      }

      console.log('Prayer notifications scheduled successfully');
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  },

  async enableNotifications() {
    await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, 'true');
  },

  async disableNotifications() {
    await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, 'false');
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  async isEnabled() {
    const enabled = await AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY);
    return enabled === 'true';
  },

  async cancelAll() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  async sendTestNotification() {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Bildirimi 🔔',
          body: 'Bildirimler başarıyla çalışıyor! Namaz vakitleri için bildirim alacaksınız.',
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
        },
      });
      return true;
    } catch (error) {
      console.error('Error sending test notification:', error);
      return false;
    }
  },
};
