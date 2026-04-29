import { View, ViewProps } from 'react-native';
import { useAppTheme } from '@/constants/theme';

export function Card({ children, className, ...props }: ViewProps) {
  return (
    <View
      className={`rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-200 dark:border-white/5 dark:bg-[#111827] dark:shadow-none ${className}`}
      {...props}>
      {children}
    </View>
  );
}
