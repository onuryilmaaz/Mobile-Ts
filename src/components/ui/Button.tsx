import { TouchableOpacity, Text, ActivityIndicator, View, StyleSheet } from 'react-native';

type ButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  className?: string;
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#0d9488',
    borderColor: '#0d9488',
  },
  secondary: {
    backgroundColor: '#e2e8f0',
    borderColor: '#e2e8f0',
  },
  danger: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: '#0d9488',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
  textPrimary: {
    color: '#ffffff',
  },
  textSecondary: {
    color: '#475569',
  },
  textDanger: {
    color: '#ffffff',
  },
  textOutline: {
    color: '#0d9488',
  },
});

export function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  className = '',
}: ButtonProps) {
  const isDisabled = loading || disabled;

  const buttonStyle = [
    styles.button,
    variant === 'primary' && styles.primary,
    variant === 'secondary' && styles.secondary,
    variant === 'danger' && styles.danger,
    variant === 'outline' && styles.outline,
    isDisabled && styles.disabled,
  ];

  const textStyle = [
    styles.text,
    variant === 'primary' && styles.textPrimary,
    variant === 'secondary' && styles.textSecondary,
    variant === 'danger' && styles.textDanger,
    variant === 'outline' && styles.textOutline,
  ];

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
      style={buttonStyle}
      className={className}>
      {loading ? (
        <ActivityIndicator color={getLoaderColor()} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
