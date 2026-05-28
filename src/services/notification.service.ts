import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { hadithService } from './hadith.service';
import { quranService } from './quran.service';

const NOTIFICATION_ENABLED_KEY = 'PRAYER_NOTIFICATIONS_ENABLED';
const NOTIFICATION_OFFSET_KEY = 'PRAYER_NOTIFICATION_OFFSET'; // dakika: 0 | 5 | 10 | 15 | 30
const NOTIFICATION_PRAYERS_KEY = 'PRAYER_NOTIFICATION_EACH'; // JSON: {imsak, gunes, ogle, ikindi, aksam, yatsi}

const REMINDER_ENABLED_KEY = 'REMINDER_ENABLED';
const REMINDER_INTERVAL_KEY = 'REMINDER_INTERVAL'; // saat: 1 | 2 | 3 | 4 | 6
const REMINDER_BLACKOUT_START_KEY = 'REMINDER_BLACKOUT_START'; // 0-23
const REMINDER_BLACKOUT_END_KEY = 'REMINDER_BLACKOUT_END'; // 0-23

export const DEFAULT_REMINDER_INTERVAL = 2;
export const DEFAULT_BLACKOUT_START = 23;
export const DEFAULT_BLACKOUT_END = 7;

const DEFAULT_PRAYER_ENABLED = {
  imsak: true,
  gunes: false,
  ogle: true,
  ikindi: true,
  aksam: true,
  yatsi: true,
};

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

  async getOffset(): Promise<number> {
    const val = await AsyncStorage.getItem(NOTIFICATION_OFFSET_KEY);
    return val ? parseInt(val) : 15;
  },

  async setOffset(minutes: number): Promise<void> {
    await AsyncStorage.setItem(NOTIFICATION_OFFSET_KEY, String(minutes));
  },

  async getPrayerEnabled(): Promise<typeof DEFAULT_PRAYER_ENABLED> {
    const val = await AsyncStorage.getItem(NOTIFICATION_PRAYERS_KEY);
    if (!val) return { ...DEFAULT_PRAYER_ENABLED };
    try { return { ...DEFAULT_PRAYER_ENABLED, ...JSON.parse(val) }; }
    catch { return { ...DEFAULT_PRAYER_ENABLED }; }
  },

  async setPrayerEnabled(key: keyof typeof DEFAULT_PRAYER_ENABLED, value: boolean): Promise<void> {
    const current = await this.getPrayerEnabled();
    current[key] = value;
    await AsyncStorage.setItem(NOTIFICATION_PRAYERS_KEY, JSON.stringify(current));
  },

  async schedulePrayerNotifications(prayerTimes: Record<string, string>) {
    try {
      if (Platform.OS === 'android' && isExpoGo) return;

      await Notifications.cancelAllScheduledNotificationsAsync();

      const enabled = await AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY);
      if (enabled !== 'true') return;

      const offset = await this.getOffset();
      const prayerEnabled = await this.getPrayerEnabled();
      const now = new Date();

      const prayers = [
        { key: 'imsak', name: 'İmsak', time: prayerTimes.imsak },
        { key: 'gunes', name: 'Güneş', time: prayerTimes.gunes },
        { key: 'ogle', name: 'Öğle', time: prayerTimes.ogle },
        { key: 'ikindi', name: 'İkindi', time: prayerTimes.ikindi },
        { key: 'aksam', name: 'Akşam', time: prayerTimes.aksam },
        { key: 'yatsi', name: 'Yatsı', time: prayerTimes.yatsi },
      ] as { key: keyof typeof DEFAULT_PRAYER_ENABLED; name: string; time: string }[];

      for (const prayer of prayers) {
        if (!prayer.time || !prayerEnabled[prayer.key]) continue;

        const [hours, minutes] = prayer.time.split(':').map(Number);

        const exactTime = new Date();
        exactTime.setHours(hours, minutes, 0, 0);

        if (exactTime > now) {
          const title = `${prayer.name} Vakti Girdi 🕌`;
          const body = `${prayer.name} namazı vakti girmiştir. Hayırlı namazlar dileriz.`;
          await Notifications.scheduleNotificationAsync({
            content: {
              title,
              subtitle: 'Namaz Vakti',
              body,
              sound: 'default',
              data: { type: 'prayer_time', prayerKey: prayer.key, prayerName: prayer.name },
            } as any,
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: exactTime },
          });
        }

        if (offset > 0) {
          const beforeTime = new Date();
          beforeTime.setHours(hours, minutes - offset, 0, 0);
          if (beforeTime > now) {
            const title = `${prayer.name} Vaktine ${offset} Dakika Kaldı ⏰`;
            const body = `${prayer.name} namazı için hazırlanma vakti.`;
            await Notifications.scheduleNotificationAsync({
              content: { title, subtitle: 'Vakit Yaklaşıyor', body, sound: 'default' } as any,
              trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: beforeTime },
            });
          }
        }
      }

      console.log('Prayer notifications scheduled successfully');
      await this.scheduleHourlyReminders();
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  },

  async getReminderEnabled(): Promise<boolean> {
    const val = await AsyncStorage.getItem(REMINDER_ENABLED_KEY);
    return val === null ? true : val === 'true';
  },

  async setReminderEnabled(value: boolean): Promise<void> {
    await AsyncStorage.setItem(REMINDER_ENABLED_KEY, String(value));
  },

  async getReminderInterval(): Promise<number> {
    const val = await AsyncStorage.getItem(REMINDER_INTERVAL_KEY);
    return val ? parseInt(val) : DEFAULT_REMINDER_INTERVAL;
  },

  async setReminderInterval(hours: number): Promise<void> {
    await AsyncStorage.setItem(REMINDER_INTERVAL_KEY, String(hours));
  },

  async getReminderBlackout(): Promise<{ start: number; end: number }> {
    const [s, e] = await Promise.all([
      AsyncStorage.getItem(REMINDER_BLACKOUT_START_KEY),
      AsyncStorage.getItem(REMINDER_BLACKOUT_END_KEY),
    ]);
    return {
      start: s !== null ? parseInt(s) : DEFAULT_BLACKOUT_START,
      end: e !== null ? parseInt(e) : DEFAULT_BLACKOUT_END,
    };
  },

  async setReminderBlackout(start: number, end: number): Promise<void> {
    await Promise.all([
      AsyncStorage.setItem(REMINDER_BLACKOUT_START_KEY, String(start)),
      AsyncStorage.setItem(REMINDER_BLACKOUT_END_KEY, String(end)),
    ]);
  },

  async scheduleHourlyReminders() {
    try {
      if (Platform.OS === 'android' && isExpoGo) return;

      const [masterEnabled, reminderEnabled] = await Promise.all([
        AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY),
        this.getReminderEnabled(),
      ]);
      if (masterEnabled !== 'true' || !reminderEnabled) return;

      const [interval, blackout] = await Promise.all([
        this.getReminderInterval(),
        this.getReminderBlackout(),
      ]);

      // Pre-fetch content so network failures don't silently drop slots
      const [verseResult, hadithResult] = await Promise.allSettled([
        quranService.getRandomVerse(),
        hadithService.getRandomHadith(),
      ]);

      const verse = verseResult.status === 'fulfilled' ? verseResult.value : null;
      const hadith = hadithResult.status === 'fulfilled' ? hadithResult.value : null;

      // Stay under iOS's 64 limit (prayer slots use at most 12)
      const HOURS_AHEAD = 48;
      const now = new Date();
      let slotIndex = 0;

      for (let i = interval; i <= HOURS_AHEAD; i += interval) {
        const scheduleTime = new Date(now.getTime() + i * 60 * 60 * 1000);
        scheduleTime.setMinutes(0, 0, 0);

        const hour = scheduleTime.getHours();
        const { start, end } = blackout;
        const inBlackout =
          start <= end ? hour >= start && hour < end : hour >= start || hour < end;
        if (inBlackout) continue;

        const useAyet = slotIndex % 2 === 0;
        slotIndex++;

        let title = '';
        let subtitle = '';
        let body = '';

        if (useAyet && verse) {
          title = '📖 İlahi Kelam';
          subtitle = `${verse.surah.name}, ${verse.verse.verse_number}. Ayet`;
          body = verse.verse.translation.text;
        } else if (!useAyet && hadith) {
          title = '✨ Nurdan Damlalar';
          subtitle = hadith.bookName;
          body = hadith.hadith.text;
        } else if (hadith) {
          title = '✨ Nurdan Damlalar';
          subtitle = hadith.bookName;
          body = hadith.hadith.text;
        } else if (verse) {
          title = '📖 İlahi Kelam';
          subtitle = `${verse.surah.name}, ${verse.verse.verse_number}. Ayet`;
          body = verse.verse.translation.text;
        }

        if (!body) continue;

        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            subtitle,
            body,
            sound: 'default',
            data: { type: 'spiritual_reminder' },
            android: {
              priority: 'high',
              style: { type: 'bigtext', text: body, title, summary: subtitle },
            },
          } as any,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: scheduleTime,
          },
        });
      }

      console.log(`Spiritual reminders scheduled: every ${interval}h, blackout ${blackout.start}:00-${blackout.end}:00`);
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
