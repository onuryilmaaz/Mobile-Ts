import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = 'document-outline', title, message, action }: EmptyStateProps) {
  return (
    <View className="items-center justify-center px-4 py-12">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-slate-100">
        <Ionicons name={icon} size={32} color="#94a3b8" />
      </View>
      <Text className="mb-2 text-lg font-semibold text-slate-900">{title}</Text>
      {message && <Text className="text-center text-sm text-slate-500">{message}</Text>}
      {action && <View className="mt-4">{action}</View>}
    </View>
  );
}
