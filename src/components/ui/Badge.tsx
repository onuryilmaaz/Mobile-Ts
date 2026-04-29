import { View, Text, ViewProps } from 'react-native';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps extends ViewProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles: Record<BadgeVariant, string> = {
  primary: 'bg-teal-100 dark:bg-teal-500/20 border-teal-200 dark:border-teal-500/30',
  success: 'bg-green-100 dark:bg-green-500/20 border-green-200 dark:border-green-500/30',
  warning: 'bg-amber-100 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30',
  danger: 'bg-red-100 dark:bg-red-500/20 border-red-200 dark:border-red-500/30',
  info: 'bg-blue-100 dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/30',
  neutral: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
};

const textColors: Record<BadgeVariant, string> = {
  primary: 'text-teal-700 dark:text-teal-400',
  success: 'text-green-700 dark:text-green-400',
  warning: 'text-amber-700 dark:text-amber-400',
  danger: 'text-red-700 dark:text-red-400',
  info: 'text-blue-700 dark:text-blue-400',
  neutral: 'text-slate-700 dark:text-slate-400',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export function Badge({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: BadgeProps) {
  return (
    <View
      className={`inline-flex items-center rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}>
      {typeof children === 'string' ? (
        <Text className={`font-semibold ${textColors[variant]}`}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}
