import { View, ViewProps } from 'react-native';
import { useThemeStore } from '@/store/theme.store';

export function Card({ children, className, style, ...props }: ViewProps) {
  const { isDark } = useThemeStore();
  
  return (
    <View
      className={`rounded-3xl border p-5 shadow-sm ${
        isDark 
          ? 'border-slate-800 bg-slate-800 shadow-none' 
          : 'border-slate-100 bg-white shadow-slate-200'
      } ${className}`}
      style={style}
      {...props}>
      {children}
    </View>
  );
}
