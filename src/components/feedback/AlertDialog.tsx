import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAlertStore, AlertType, AlertButton } from '@/store/alert.store';
import { BlurView } from 'expo-blur';

const getIconConfig = (type: AlertType) => {
  switch (type) {
    case 'success':
      return { name: 'checkmark-circle' as const, color: '#10b981', bgColor: '#d1fae5' };
    case 'error':
      return { name: 'close-circle' as const, color: '#ef4444', bgColor: '#fee2e2' };
    case 'warning':
      return { name: 'warning' as const, color: '#f59e0b', bgColor: '#fef3c7' };
    case 'confirm':
      return { name: 'help-circle' as const, color: '#0d9488', bgColor: '#ccfbf1' };
    default:
      return { name: 'information-circle' as const, color: '#3b82f6', bgColor: '#dbeafe' };
  }
};

export function AlertDialog() {
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

  const iconConfig = getIconConfig(type);

  const getButtonStyle = (
    style?: 'default' | 'cancel' | 'destructive',
    index?: number,
    total?: number
  ) => {
    const isCancel = style === 'cancel';
    const isDestructive = style === 'destructive';

    const containerClass = [
      'flex-1 h-12 rounded-[14px] justify-center items-center min-w-[100px]',
      isCancel && 'bg-slate-100',
      isDestructive && 'bg-red-500',
      !isCancel && !isDestructive && 'bg-teal-600',
    ]
      .filter(Boolean)
      .join(' ');

    const textClass = [
      'text-base font-semibold',
      isCancel && 'text-slate-500',
      isDestructive && 'text-white',
      !isCancel && !isDestructive && 'text-white',
    ]
      .filter(Boolean)
      .join(' ');

    return {
      container: containerClass,
      text: textClass,
    };
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <BlurView intensity={20} tint="dark" className="flex-1 items-center justify-center">
        <TouchableWithoutFeedback onPress={hide}>
          <View className="absolute inset-0 bg-black/40" />
        </TouchableWithoutFeedback>

        <Animated.View
          className="w-[85%] max-w-[340px] items-center rounded-3xl bg-white p-6 shadow-xl shadow-black/25"
          style={{
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }}>
          <View
            className="mb-4 h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: iconConfig.bgColor }}>
            <Ionicons name={iconConfig.name} size={32} color={iconConfig.color} />
          </View>

          <Text className="mb-2 text-center text-xl font-bold text-slate-800">{title}</Text>
          {message && (
            <Text className="mb-2 text-center text-[15px] leading-[22px] text-slate-500">
              {message}
            </Text>
          )}

          <View className={`mt-4 w-full flex-row gap-3 ${buttons.length > 2 ? 'flex-col' : ''}`}>
            {buttons.map((button, index) => {
              const buttonStyle = getButtonStyle(button.style, index, buttons.length);
              return (
                <TouchableOpacity
                  key={index}
                  className={buttonStyle.container}
                  onPress={() => handleButtonPress(button)}
                  activeOpacity={0.8}>
                  <Text className={buttonStyle.text}>{button.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}
