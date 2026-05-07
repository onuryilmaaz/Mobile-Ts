import { useColorScheme } from 'nativewind';

export function useTheme() {
  const { colorScheme } = useColorScheme();
  return { isDark: colorScheme === 'dark' };
}
