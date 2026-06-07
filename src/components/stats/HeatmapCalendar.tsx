import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

type Props = {
  /** Map of YYYY-MM-DD → completed prayer count (0-5) */
  data: Record<string, number>;
  /** Days to show (default 84 = 12 weeks) */
  days?: number;
};

const DAY_LABEL = ['P', 'P', 'S', 'Ç', 'P', 'C', 'C']; // Pzt..Paz tek harf
const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

function ymd(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * GitHub-style contribution heatmap. Cell color intensity scales with daily
 * completed prayer count (0..5). Weeks are columns, days are rows (Mon..Sun).
 */
export function HeatmapCalendar({ data, days = 84 }: Props) {
  const { isDark } = useTheme();

  const grid = useMemo(() => {
    // Build N days backwards, snap to a Monday start so weeks align.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the most recent Monday on or before today
    const todayDow = (today.getDay() + 6) % 7; // 0=Mon..6=Sun
    const lastMon = new Date(today);
    lastMon.setDate(today.getDate() - todayDow);

    const weekCount = Math.ceil(days / 7);
    const startMon = new Date(lastMon);
    startMon.setDate(lastMon.getDate() - (weekCount - 1) * 7);

    type Cell = { date: Date; key: string; value: number; isFuture: boolean };
    const weeks: Cell[][] = [];

    for (let w = 0; w < weekCount; w++) {
      const week: Cell[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(startMon);
        date.setDate(startMon.getDate() + w * 7 + d);
        const key = ymd(date);
        const isFuture = date > today;
        week.push({
          date,
          key,
          value: data[key] ?? 0,
          isFuture,
        });
      }
      weeks.push(week);
    }
    return weeks;
  }, [data, days]);

  // Month labels — show when a column's first row is the 1..7 of a new month
  const monthLabels = useMemo(() => {
    return grid.map((week) => {
      const firstDay = week[0]!.date;
      if (firstDay.getDate() <= 7) return MONTHS[firstDay.getMonth()];
      return '';
    });
  }, [grid]);

  const colorFor = (v: number, future: boolean): string => {
    if (future) return 'transparent';
    if (v <= 0) return isDark ? '#1e293b' : '#e2e8f0';
    if (v === 1) return isDark ? '#0f3a36' : '#ccfbf1';
    if (v === 2) return isDark ? '#115e59' : '#5eead4';
    if (v === 3) return isDark ? '#0f766e' : '#2dd4bf';
    if (v === 4) return isDark ? '#14b8a6' : '#14b8a6';
    return isDark ? '#2dd4bf' : '#0f766e'; // 5
  };

  return (
    <View>
      {/* Month labels */}
      <View className="ml-7 flex-row" style={{ gap: 3 }}>
        {monthLabels.map((label, i) => (
          <View key={i} style={{ width: 14 }}>
            <Text className="text-[8px] font-bold text-slate-400" numberOfLines={1}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      <View className="mt-1 flex-row">
        {/* Day labels */}
        <View className="mr-2" style={{ gap: 3 }}>
          {DAY_LABEL.map((d, i) => (
            <View key={i} className="items-end" style={{ width: 14, height: 14 }}>
              {i % 2 === 0 && (
                <Text className="text-[8px] font-bold text-slate-400">{d}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Grid columns */}
        <View className="flex-row" style={{ gap: 3 }}>
          {grid.map((week, wi) => (
            <View key={wi} style={{ gap: 3 }}>
              {week.map((cell) => (
                <View
                  key={cell.key}
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    backgroundColor: colorFor(cell.value, cell.isFuture),
                  }}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* Legend */}
      <View className="mt-3 flex-row items-center justify-end gap-1.5">
        <Text className="mr-1 text-[10px] font-bold text-slate-400">Az</Text>
        {[0, 1, 2, 3, 5].map((v) => (
          <View
            key={v}
            style={{
              width: 11,
              height: 11,
              borderRadius: 2,
              backgroundColor: colorFor(v, false),
            }}
          />
        ))}
        <Text className="ml-1 text-[10px] font-bold text-slate-400">Çok</Text>
      </View>
    </View>
  );
}
