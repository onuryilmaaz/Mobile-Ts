import { View, ViewProps } from 'react-native';

export function Card({ children, className, ...props }: ViewProps) {
  return (
    <View
      className={`rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-200 ${className}`}
      {...props}>
      {children}
    </View>
  );
}
