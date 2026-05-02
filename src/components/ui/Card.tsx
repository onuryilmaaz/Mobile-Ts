import { View, ViewProps } from 'react-native';
import { useThemeStore } from '@/store/theme.store';

export function Card({ children, className, style, ...props }: ViewProps) {
  const { isDark } = useThemeStore();

  return (
    <View
      className={`rounded-3xl border p-5 ${
        isDark
          ? 'border-slate-800 bg-slate-900'
          : 'border-slate-100 bg-white shadow-sm shadow-black/5'
      } ${className}`}
      style={style}
      {...props}>
      {children}
    </View>
  );
}
