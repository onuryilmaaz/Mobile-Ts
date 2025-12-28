import { Pressable, Text, ActivityIndicator } from 'react-native';

type ButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  className?: string;
};

export function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  className = '',
}: ButtonProps) {
  const isDisabled = loading || disabled;

  let bgClass = 'bg-primary-600';
  let textClass = 'text-white';
  let borderClass = 'border-primary-600';

  if (variant === 'secondary') {
    bgClass = 'bg-slate-200';
    textClass = 'text-slate-700';
    borderClass = 'border-slate-200';
  } else if (variant === 'danger') {
    bgClass = 'bg-red-600';
    textClass = 'text-white';
    borderClass = 'border-red-600';
  } else if (variant === 'outline') {
    bgClass = 'bg-transparent';
    textClass = 'text-primary-600';
    borderClass = 'border-primary-600';
  }

  if (isDisabled) {
    if (variant === 'outline') {
      textClass = 'text-primary-300';
      borderClass = 'border-primary-300';
    } else {
      bgClass = 'bg-primary-300';
      borderClass = 'border-primary-300';
    }
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`
        h-12 items-center justify-center rounded-2xl border
        ${bgClass} ${borderClass} shadow-sm active:opacity-90
        ${className}
      `}>
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#0d9488' : '#fff'} />
      ) : (
        <Text className={`text-base font-bold ${textClass}`}>{title}</Text>
      )}
    </Pressable>
  );
}
