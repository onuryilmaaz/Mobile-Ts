import { View, ViewProps } from 'react-native';

export function Card({ children, className, style, ...props }: ViewProps) {
  return (
    <View
      className={`rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none ${className}`}
      style={style}
      {...props}>
      {children}
    </View>
  );
}
