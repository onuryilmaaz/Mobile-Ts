import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';

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

  const baseButtonClasses = 'h-12 rounded-2xl border-2 items-center justify-center';

  const variantClasses = {
    primary: 'bg-teal-600 border-teal-600',
    secondary: 'bg-slate-200 border-slate-200',
    danger: 'bg-red-600 border-red-600',
    outline: 'bg-transparent border-teal-600',
  };

  const textBaseClasses = 'text-base font-bold';

  const textVariantClasses = {
    primary: 'text-white',
    secondary: 'text-slate-600',
    danger: 'text-white',
    outline: 'text-teal-600',
  };

  const buttonClass = [
    baseButtonClasses,
    variantClasses[variant],
    isDisabled && 'opacity-50',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const textClass = [textBaseClasses, textVariantClasses[variant]].filter(Boolean).join(' ');

  const getLoaderColor = () => {
    if (variant === 'outline') return '#0d9488';
    if (variant === 'secondary') return '#475569';
    return '#ffffff';
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      className={buttonClass}>
      {loading ? (
        <ActivityIndicator color={getLoaderColor()} />
      ) : (
        <Text className={textClass}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
