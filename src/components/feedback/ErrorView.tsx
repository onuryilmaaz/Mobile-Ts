import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ErrorViewProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
  fullScreen?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function ErrorView({
  title = 'Bir hata oluştu',
  message = 'Lütfen daha sonra tekrar deneyin.',
  onRetry,
  retryText = 'Tekrar Dene',
  fullScreen = false,
  icon = 'alert-circle-outline',
}: ErrorViewProps) {
  const content = (
    <View className="items-center px-6 py-8">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <Ionicons name={icon} size={32} color="#dc2626" />
      </View>

      <Text className="mb-2 text-center text-lg font-bold text-slate-900">{title}</Text>

      <Text className="mb-6 text-center text-sm text-slate-500">{message}</Text>

      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          className="flex-row items-center gap-2 rounded-xl bg-primary-600 px-6 py-3"
          activeOpacity={0.8}>
          <Ionicons name="refresh" size={18} color="white" />
          <Text className="font-semibold text-white">{retryText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (fullScreen) {
    return <View className="flex-1 items-center justify-center bg-slate-50">{content}</View>;
  }

  return content;
}

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorView
      title="Bağlantı Hatası"
      message="İnternet bağlantınızı kontrol edin ve tekrar deneyin."
      icon="cloud-offline-outline"
      onRetry={onRetry}
    />
  );
}

export function NotFoundError({
  message = 'Aradığınız içerik bulunamadı.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return <ErrorView title="Bulunamadı" message={message} icon="search-outline" onRetry={onRetry} />;
}
