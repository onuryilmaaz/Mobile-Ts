import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { hadithService } from './hadith.service';
import { quranService } from './quran.service';
import { calendarService } from './calendar.service';

const NOTIFICATION_ENABLED_KEY = 'PRAYER_NOTIFICATIONS_ENABLED';
const NOTIFICATION_OFFSET_KEY = 'PRAYER_NOTIFICATION_OFFSET'; // dakika: 0 | 5 | 10 | 15 | 30
const NOTIFICATION_PRAYERS_KEY = 'PRAYER_NOTIFICATION_EACH'; // JSON: {imsak, gunes, ogle, ikindi, aksam, yatsi}

const REMINDER_ENABLED_KEY = 'REMINDER_ENABLED';
const REMINDER_INTERVAL_KEY = 'REMINDER_INTERVAL'; // saat: 1 | 2 | 3 | 4 | 6
const REMINDER_BLACKOUT_START_KEY = 'REMINDER_BLACKOUT_START'; // 0-23
const REMINDER_BLACKOUT_END_KEY = 'REMINDER_BLACKOUT_END'; // 0-23
const MUTE_UNTIL_KEY = 'NOTIFICATION_MUTE_UNTIL'; // epoch ms

const RELIGIOUS_DAY_ENABLED_KEY = 'RELIGIOUS_DAY_NOTIFICATIONS_ENABLED';
const CUMA_REMINDER_ENABLED_KEY = 'CUMA_REMINDER_ENABLED';

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

  async schedulePrayerNotifications(
    days: Array<{ date: string; times: Record<string, string> }>
  ) {
    try {
      if (Platform.OS === 'android' && isExpoGo) return;

      await Notifications.cancelAllScheduledNotificationsAsync();

      const enabled = await AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY);
      if (enabled !== 'true') return;

      // Sessiz mod aktifse hiçbir vakit bildirimi schedule etme — mute süresi
      // dolduğunda PrayerTimesCard tekrar bu fonksiyonu çağırıyor.
      if (await this.isMuted()) {
        console.log('Prayer notifications skipped — mute is active');
        return;
      }

      const offset = await this.getOffset();
      const prayerEnabled = await this.getPrayerEnabled();
      const now = new Date();

      const PRAYERS: { key: keyof typeof DEFAULT_PRAYER_ENABLED; name: string }[] = [
        { key: 'imsak', name: 'İmsak' },
        { key: 'gunes', name: 'Güneş' },
        { key: 'ogle', name: 'Öğle' },
        { key: 'ikindi', name: 'İkindi' },
        { key: 'aksam', name: 'Akşam' },
        { key: 'yatsi', name: 'Yatsı' },
      ];

      // iOS allows 64 scheduled notifications total.
      // Reserve ~14 slots for hourly reminders → 50 for prayer notifications.
      // 6 prayers × 2 (exact + offset) = 12/day → covers 4 days comfortably.
      const MAX_PRAYER_SLOTS = 50;
      let scheduled = 0;

      for (const day of days) {
        if (scheduled >= MAX_PRAYER_SLOTS) break;

        for (const prayer of PRAYERS) {
          if (!day.times[prayer.key] || !prayerEnabled[prayer.key]) continue;

          const [hours, minutes] = day.times[prayer.key].split(':').map(Number);

          const exactTime = new Date(day.date);
          exactTime.setHours(hours, minutes, 0, 0);

          if (exactTime > now && scheduled < MAX_PRAYER_SLOTS) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `${prayer.name} Vakti Girdi 🕌`,
                subtitle: 'Namaz Vakti',
                body: `${prayer.name} namazı vakti girmiştir. Hayırlı namazlar dileriz.`,
                sound: 'default',
                data: { type: 'prayer_time', prayerKey: prayer.key, prayerName: prayer.name },
              } as any,
              trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: exactTime },
            });
            scheduled++;
          }

          if (offset > 0 && scheduled < MAX_PRAYER_SLOTS) {
            const beforeTime = new Date(exactTime.getTime() - offset * 60 * 1000);
            if (beforeTime > now) {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: `${prayer.name} Vaktine ${offset} Dakika Kaldı ⏰`,
                  subtitle: 'Vakit Yaklaşıyor',
                  body: `${prayer.name} namazı için hazırlanma vakti.`,
                  sound: 'default',
                } as any,
                trigger: {
                  type: Notifications.SchedulableTriggerInputTypes.DATE,
                  date: beforeTime,
                },
              });
              scheduled++;
            }
          }
        }
      }

      console.log(`Prayer notifications scheduled: ${scheduled} slots used`);
      await this.scheduleHourlyReminders();
      await this.scheduleReligiousDayReminders();
      await this.scheduleCumaReminders();
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  },

  async getReligiousDayEnabled(): Promise<boolean> {
    const val = await AsyncStorage.getItem(RELIGIOUS_DAY_ENABLED_KEY);
    return val === null ? true : val === 'true';
  },

  async setReligiousDayEnabled(value: boolean): Promise<void> {
    await AsyncStorage.setItem(RELIGIOUS_DAY_ENABLED_KEY, String(value));
  },

  async scheduleReligiousDayReminders() {
    try {
      if (Platform.OS === 'android' && isExpoGo) return;
      const [masterEnabled, relEnabled] = await Promise.all([
        AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY),
        this.getReligiousDayEnabled(),
      ]);
      if (masterEnabled !== 'true' || !relEnabled) return;
      if (await this.isMuted()) return;

      const days = calendarService.getReligiousDays();
      const now = new Date();
      // Stay within iOS 64-notification budget: 6 closest events × 2 slots = 12
      const upcoming = days.filter((d) => d.date >= now).slice(0, 6);

      for (const day of upcoming) {
        // Slot 1 — gün öncesi akşam 20:00
        const dayBefore = new Date(day.date);
        dayBefore.setDate(dayBefore.getDate() - 1);
        dayBefore.setHours(20, 0, 0, 0);
        if (dayBefore > now) {
          const body = day.hijriDate
            ? `Yarın ${day.name} (${day.hijriDate}). Hayırlı bir gün diliyoruz.`
            : `Yarın ${day.name}. Hayırlı bir gün diliyoruz.`;
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `🌙 ${day.name} Yaklaşıyor`,
              subtitle: 'Mübarek Gün',
              body,
              sound: 'default',
              data: { type: 'religious_day', dayId: day.id, when: 'before' },
            } as any,
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: dayBefore,
            },
          });
        }

        // Slot 2 — günün sabahı 08:00
        const morning = new Date(day.date);
        morning.setHours(8, 0, 0, 0);
        if (morning > now) {
          const body = day.hijriDate
            ? `Bugün ${day.name} (${day.hijriDate}). Hayırlı olsun.`
            : `Bugün ${day.name}. Hayırlı olsun.`;
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `🕌 Bugün ${day.name}`,
              subtitle: 'Mübarek Gün',
              body,
              sound: 'default',
              data: { type: 'religious_day', dayId: day.id, when: 'morning' },
            } as any,
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: morning,
            },
          });
        }
      }
      console.log(`Religious day reminders scheduled: ${upcoming.length} events`);
    } catch (e) {
      console.error('Error scheduling religious day reminders:', e);
    }
  },

  async getCumaReminderEnabled(): Promise<boolean> {
    const val = await AsyncStorage.getItem(CUMA_REMINDER_ENABLED_KEY);
    return val === null ? true : val === 'true';
  },

  async setCumaReminderEnabled(value: boolean): Promise<void> {
    await AsyncStorage.setItem(CUMA_REMINDER_ENABLED_KEY, String(value));
  },

  /**
   * Cuma hatırlatmaları: önümüzdeki birkaç Cuma için
   * - Perşembe akşamı 20:00 → "Yarın Cuma"
   * - Cuma sabahı 09:00 → "Bugün Cuma" + hutbe hatırlatması
   */
  async scheduleCumaReminders() {
    try {
      if (Platform.OS === 'android' && isExpoGo) return;
      const [masterEnabled, cumaEnabled] = await Promise.all([
        AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY),
        this.getCumaReminderEnabled(),
      ]);
      if (masterEnabled !== 'true' || !cumaEnabled) return;
      if (await this.isMuted()) return;

      const now = new Date();
      const WEEKS = 3; // önümüzdeki 3 Cuma (iOS 64 bildirim bütçesi için sınırlı)

      // Bu haftanın (veya bugünün) Cuma gününü bul — gün 5
      const firstFriday = new Date(now);
      firstFriday.setHours(0, 0, 0, 0);
      const delta = (5 - firstFriday.getDay() + 7) % 7;
      firstFriday.setDate(firstFriday.getDate() + delta);

      let scheduled = 0;
      for (let w = 0; w < WEEKS; w++) {
        const friday = new Date(firstFriday);
        friday.setDate(friday.getDate() + w * 7);

        // Perşembe akşamı 20:00
        const thuEve = new Date(friday);
        thuEve.setDate(thuEve.getDate() - 1);
        thuEve.setHours(20, 0, 0, 0);
        if (thuEve > now) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '🕌 Yarın Cuma',
              subtitle: 'Cuma Hazırlığı',
              body: 'Yarın Cuma günü. Cuma namazını ve Kehf Suresi okumayı unutmayın. Hayırlı Cumalar.',
              sound: 'default',
              data: { type: 'cuma_reminder', when: 'thursday_evening' },
            } as any,
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: thuEve },
          });
          scheduled++;
        }

        // Cuma sabahı 09:00
        const friMorning = new Date(friday);
        friMorning.setHours(9, 0, 0, 0);
        if (friMorning > now) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '🌙 Bugün Cuma',
              subtitle: 'Hayırlı Cumalar',
              body: 'Bugün Cuma. Cuma namazına hazırlanın; bu haftanın Diyanet hutbesini uygulamadan okuyabilirsiniz.',
              sound: 'default',
              data: { type: 'cuma_reminder', when: 'friday_morning' },
            } as any,
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: friMorning },
          });
          scheduled++;
        }
      }
      console.log(`Cuma reminders scheduled: ${scheduled} slots`);
    } catch (e) {
      console.error('Error scheduling cuma reminders:', e);
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
      if (await this.isMuted()) return;

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

  // ─── Mute / Sessiz Mod ─────────────────────────────────────────────────────

  /**
   * Returns the timestamp (epoch ms) until which notifications are muted, or
   * `null` if mute is not active. Auto-cleans expired entries.
   */
  async getMuteUntil(): Promise<number | null> {
    const raw = await AsyncStorage.getItem(MUTE_UNTIL_KEY);
    if (!raw) return null;
    const ts = Number(raw);
    if (!Number.isFinite(ts) || ts <= Date.now()) {
      // expired — clear it so the rest of the app sees a clean state
      await AsyncStorage.removeItem(MUTE_UNTIL_KEY);
      return null;
    }
    return ts;
  },

  async isMuted(): Promise<boolean> {
    return (await this.getMuteUntil()) !== null;
  },

  /**
   * Mute all future notifications for `durationMinutes` minutes.
   * - Cancels every already-scheduled notification
   * - Saves the resume timestamp so UI can show a countdown
   */
  async muteFor(durationMinutes: number): Promise<number> {
    const until = Date.now() + durationMinutes * 60_000;
    await AsyncStorage.setItem(MUTE_UNTIL_KEY, String(until));
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log(`Notifications muted for ${durationMinutes} min (until ${new Date(until).toLocaleString('tr-TR')})`);
    return until;
  },

  /**
   * Lift mute immediately. Does NOT re-schedule by itself — caller should re-run
   * schedulePrayerNotifications() with fresh prayer times.
   */
  async unmute(): Promise<void> {
    await AsyncStorage.removeItem(MUTE_UNTIL_KEY);
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
