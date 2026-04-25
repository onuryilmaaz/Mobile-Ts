import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { hadithService } from './hadith.service';
import { quranService } from './quran.service';

const NOTIFICATION_ENABLED_KEY = 'PRAYER_NOTIFICATIONS_ENABLED';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

if (!isExpoGo || Platform.OS === 'ios') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export const notificationService = {
  async requestPermissions() {
    if (!Device.isDevice || (Platform.OS === 'android' && isExpoGo)) {
      console.log('Notifications are not supported in this environment');
      return true;
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
      if (Platform.OS === 'android' && isExpoGo) return;

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
          const title = `${prayer.name} Vakti Girdi 🕌`;
          const body = `${prayer.name} namazı vakti girmiştir. Hayırlı namazlar dileriz.`;

          await Notifications.scheduleNotificationAsync({
            content: {
              title,
              subtitle: 'Namaz Vakti Hatırlatıcısı',
              body,
              sound: 'default',
              android: {
                priority: 'high',
                style: {
                  type: 'bigtext',
                  text: body,
                  title: title,
                },
              },
            } as any,
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: exactTime,
            },
          });
        }

        const thirtyMinBefore = new Date();
        thirtyMinBefore.setHours(hours, minutes - 30, 0, 0);

        if (thirtyMinBefore > now) {
          const title = `${prayer.name} Vaktine 30 Dakika Kaldı ⏰`;
          const body = `${prayer.name} namazı vaktine 30 dakika kaldı. Abdest ve hazırlık için vakit daralıyor.`;

          await Notifications.scheduleNotificationAsync({
            content: {
              title,
              subtitle: 'Vakit Yaklaşıyor',
              body,
              sound: 'default',
              android: {
                priority: 'high',
                style: {
                  type: 'bigtext',
                  text: body,
                  title: title,
                },
              },
            } as any,
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: thirtyMinBefore,
            },
          });
        }
      }

      console.log('Prayer notifications scheduled successfully');
      await this.scheduleHourlyReminders();
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  },

  async scheduleHourlyReminders() {
    try {
      if (Platform.OS === 'android' && isExpoGo) return;

      const enabled = await AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY);
      if (enabled !== 'true') return;

      const now = new Date();

      for (let i = 1; i <= 12; i++) {
        const scheduleTime = new Date(now.getTime() + i * 60 * 60 * 1000);
        scheduleTime.setMinutes(0, 0, 0);

        const isAyet = i % 2 === 0;

        let title = '';
        let subtitle = '';
        let body = '';

        if (isAyet) {
          const result = await quranService.getRandomVerse();
          if (result) {
            title = '📖 İlahi Kelam';
            subtitle = `${result.surah.name}, ${result.verse.verse_number}. Ayet`;
            body = result.verse.translation.text;
          }
        } else {
          const result = await hadithService.getRandomHadith();
          if (result) {
            title = '✨ Nurdan Damlalar';
            subtitle = result.bookName;
            body = result.hadith.text;
          }
        }

        if (body) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title,
              subtitle,
              body,
              sound: 'default',
              data: { type: 'spiritual_reminder' },
              android: {
                priority: 'high',
                style: {
                  type: 'bigtext',
                  text: body,
                  title: title,
                  summary: subtitle,
                },
              },
            } as any,
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: scheduleTime,
            },
          });
        }
      }

      console.log('Hourly spiritual reminders scheduled successfully');
    } catch (error) {
      console.error('Error scheduling hourly reminders:', error);
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
      if (Platform.OS === 'android' && isExpoGo) {
        console.warn('Android notifications are not supported in Expo Go SDK 53+');
        return false;
      }
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Bildirimi 🔔',
          subtitle: 'Günün İlhamı buradan görünecek',
          body: 'Bildirimler başarıyla çalışıyor!\n\nNamaz vakitleri için bildirim alacaksınız. Bu uzun bir test metnidir ve bildirim paneline basılı tuttuğunuzda veya aşağı kaydırdığınızda tamamının görünmesi gerekir. \n\nDenemek için şimdi bu bildirime basılı tutun!',
          sound: 'default',
          android: {
            priority: 'high',
            style: {
              type: 'bigtext',
              text: 'Bildirimler başarıyla çalışıyor!\n\nNamaz vakitleri için bildirim alacaksınız. Bu uzun bir test metnidir ve bildirim paneline basılı tuttuğunuzda veya aşağı kaydırdığınızda tamamının görünmesi gerekir. \n\nDenemek için şimdi bu bildirime basılı tutun!',
              title: 'Test Bildirimi 🔔',
              summary: 'Günün İlhamı',
            },
          },
        } as any,
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
