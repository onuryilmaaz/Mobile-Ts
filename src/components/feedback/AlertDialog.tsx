import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAlertStore, AlertType, AlertButton } from '@/store/alert.store';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/hooks/useTheme';

const getIconConfig = (type: AlertType, isDark: boolean) => {
  switch (type) {
    case 'success':
      return {
        name: 'checkmark-circle' as const,
        color: isDark ? '#34d399' : '#10b981',
        bgColor: isDark ? 'rgba(52, 211, 153, 0.1)' : '#d1fae5',
      };
    case 'error':
      return {
        name: 'close-circle' as const,
        color: isDark ? '#f87171' : '#ef4444',
        bgColor: isDark ? 'rgba(248, 113, 113, 0.1)' : '#fee2e2',
      };
    case 'warning':
      return {
        name: 'warning' as const,
        color: isDark ? '#fbbf24' : '#f59e0b',
        bgColor: isDark ? 'rgba(251, 191, 36, 0.1)' : '#fef3c7',
      };
    case 'confirm':
      return {
        name: 'help-circle' as const,
        color: isDark ? '#2dd4bf' : '#0d9488',
        bgColor: isDark ? 'rgba(45, 212, 191, 0.1)' : '#ccfbf1',
      };
    default:
      return {
        name: 'information-circle' as const,
        color: isDark ? '#60a5fa' : '#3b82f6',
        bgColor: isDark ? 'rgba(96, 165, 250, 0.1)' : '#dbeafe',
      };
  }
};

export function AlertDialog() {
  const { isDark } = useTheme();
  const { visible, type, title, message, buttons, hide } = useAlertStore();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visible, opacityAnim, scaleAnim]);

  const handleButtonPress = async (button: AlertButton) => {
    if (button.onPress) {
      await button.onPress();
    }
    hide();
  };

  const iconConfig = getIconConfig(type, isDark);

  const getButtonStyles = (style?: 'default' | 'cancel' | 'destructive') => {
    const isCancel = style === 'cancel';
    const isDestructive = style === 'destructive';

    return {
      container: `flex-1 h-12 rounded-2xl items-center justify-center min-w-[100px] ${
        isCancel
          ? 'bg-slate-100 dark:bg-slate-900/40'
          : isDestructive
            ? 'bg-red-500 dark:bg-red-600'
            : 'bg-teal-600 dark:bg-teal-500'
      }`,
      text: `text-base font-semibold ${
        isCancel ? 'text-slate-600 dark:text-slate-300' : 'text-white'
      }`,
    };
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <View className="flex-1 items-center justify-center bg-black/40 px-6">
        {Platform.OS === 'ios' && (
          <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} className="absolute inset-0" />
        )}

        <TouchableWithoutFeedback onPress={hide}>
          <View className="absolute inset-0" />
        </TouchableWithoutFeedback>

        <Animated.View
          style={{
            width: '100%',
            maxWidth: 340,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)',
          }}
          className="items-center rounded-[32px] bg-white p-8 shadow-2xl dark:bg-slate-800/70 dark:shadow-none">
          <View
            style={{ backgroundColor: iconConfig.bgColor }}
            className="mb-4 h-16 w-16 items-center justify-center rounded-full">
            <Ionicons name={iconConfig.name} size={32} color={iconConfig.color} />
          </View>

          <Text className="mb-2 text-center text-xl font-bold text-slate-900 dark:text-white">
            {title}
          </Text>
          {message && (
            <Text className="mb-6 text-center text-base leading-6 text-slate-600 dark:text-slate-300">
              {message}
            </Text>
          )}

          <View className={`w-full gap-3 ${buttons.length > 2 ? 'flex-col' : 'flex-row'}`}>
            {buttons.map((button, index) => {
              const styles = getButtonStyles(button.style);
              return (
                <TouchableOpacity
                  key={index}
                  className={styles.container}
                  onPress={() => handleButtonPress(button)}
                  activeOpacity={0.8}>
                  <Text className={styles.text}>{button.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
