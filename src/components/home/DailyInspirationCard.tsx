import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { hadithService } from '@/services/hadith.service';
import { quranService } from '@/services/quran.service';
import { useAppTheme } from '@/constants/theme';

interface Inspiration {
  type: 'Ayet' | 'Hadis';
  text: string;
  source: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export function DailyInspirationCard() {
  const [current, setCurrent] = useState<Inspiration | null>(null);
  const [loading, setLoading] = useState(true);
  const { colors, isDark } = useAppTheme();

  const fetchInspiration = useCallback(async () => {
    try {
      setLoading(true);
      const randomType = Math.random() > 0.5 ? 'Ayet' : 'Hadis';

      if (randomType === 'Ayet') {
        const result = await quranService.getRandomVerse();
        if (result) {
          setCurrent({
            type: 'Ayet',
            text: result.verse.translation.text,
            source: `${result.surah.name} Suresi, ${result.verse.verse_number}. Ayet`,
            icon: 'sunny',
          });
        }
      } else {
        const result = await hadithService.getRandomHadith();
        if (result) {
          setCurrent({
            type: 'Hadis',
            text: result.hadith.text,
            source: result.bookName,
            icon: 'heart',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching inspiration:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInspiration();
  }, [fetchInspiration]);

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchInspiration();
  };

  const shareInspiration = async () => {
    if (!current) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await Share.share({
        message: `"${current.text}" - ${current.source} #SalahApp`,
      });
    } catch (e) {
      console.log(e);
    }
  };

  if (!current && loading) {
    return (
      <View style={{
        marginHorizontal: 16, marginBottom: 24, alignItems: 'center', justifyContent: 'center',
        borderRadius: 32, padding: 48, backgroundColor: colors.card,
        borderWidth: 1, borderColor: colors.cardBorder,
      }}>
        <ActivityIndicator color={colors.teal} />
      </View>
    );
  }

  if (!current) return null;

  return (
    <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
      <Animated.View
        layout={Layout.springify()}
        style={{
          overflow: 'hidden', borderRadius: 32,
          borderWidth: 1, borderColor: colors.cardBorder,
          backgroundColor: colors.card,
          shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.05,
          shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{
              height: 32, width: 32, alignItems: 'center', justifyContent: 'center',
              borderRadius: 12, backgroundColor: isDark ? 'rgba(20,184,166,0.15)' : colors.tealDim,
            }}>
              <Ionicons name={current.icon as any} size={16} color={colors.teal} />
            </View>
            <Text style={{
              fontSize: 12, fontWeight: '900', textTransform: 'uppercase',
              letterSpacing: 2, color: colors.textMuted,
            }}>
              {current.type}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={shareInspiration}
              style={{
                height: 32, width: 32, alignItems: 'center', justifyContent: 'center',
                borderRadius: 16, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.settingsBg,
              }}>
              <Ionicons name="share-outline" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRefresh}
              style={{
                height: 32, width: 32, alignItems: 'center', justifyContent: 'center',
                borderRadius: 16, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.settingsBg,
              }}>
              {loading ? (
                <ActivityIndicator size="small" color={colors.textSecondary} />
              ) : (
                <Ionicons name="refresh-outline" size={16} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Animated.View
          key={current.text}
          entering={FadeIn.duration(600)}
          style={{ alignItems: 'center', padding: 32 }}>
          <Text
            style={{
              textAlign: 'center', fontSize: 18, fontWeight: 'bold', fontStyle: 'italic',
              lineHeight: 32, color: colors.textPrimary,
            }}
            numberOfLines={0}>
            "{current.text}"
          </Text>
          <View style={{ marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ height: 1, width: 32, backgroundColor: colors.cardBorder }} />
            <Text style={{
              fontSize: 10, fontWeight: '900', textTransform: 'uppercase',
              letterSpacing: -0.5, color: colors.teal,
            }}>
              {current.source}
            </Text>
            <View style={{ height: 1, width: 32, backgroundColor: colors.cardBorder }} />
          </View>
        </Animated.View>

        <View style={{
          alignItems: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : colors.settingsBg,
          paddingHorizontal: 24, paddingVertical: 16,
        }}>
          <Text style={{
            fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase',
            letterSpacing: 2, color: colors.textMuted,
          }}>
            Manevi Huzur İçin Küçük Bir Hatırlatma
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}
