import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
  size?: 'small' | 'large';
  color?: string;
}

export function Loading({
  message,
  fullScreen = false,
  size = 'large',
  color,
}: LoadingProps) {
  const { isDark } = useTheme();
  const loaderColor = color || (isDark ? '#2dd4bf' : '#0f766e');

  if (fullScreen) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-900">
        <View className="items-center rounded-2xl bg-white p-8 shadow-sm shadow-black/5 dark:bg-slate-800 dark:shadow-none">
          <ActivityIndicator size={size} color={loaderColor} />
          {message && (
            <Text className="mt-4 text-base font-medium text-slate-600 dark:text-slate-400">
              {message}
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View className="items-center justify-center py-8">
      <ActivityIndicator size={size} color={loaderColor} />
      {message && (
        <Text className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          {message}
        </Text>
      )}
    </View>
  );
}

export function PageLoading({ message = 'Yükleniyor...' }: { message?: string }) {
  return <Loading fullScreen message={message} />;
}

export function InlineLoading({ message }: { message?: string }) {
  return <Loading size="small" message={message} />;
}
