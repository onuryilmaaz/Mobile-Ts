import { View, ViewProps } from 'react-native';

interface DividerProps extends ViewProps {
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'sm' | 'md' | 'lg';
}

const spacingStyles = {
  sm: 'my-2',
  md: 'my-4',
  lg: 'my-6',
};

export function Divider({
  orientation = 'horizontal',
  spacing = 'md',
  className = '',
  ...props
}: DividerProps) {
  if (orientation === 'vertical') {
    return <View className={`w-px bg-slate-200 ${className}`} {...props} />;
  }

  return <View className={`h-px bg-slate-200 ${spacingStyles[spacing]} ${className}`} {...props} />;
}
