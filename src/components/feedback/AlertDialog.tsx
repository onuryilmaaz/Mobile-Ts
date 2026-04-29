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

    return {
      container: {
        flex: 1,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        minWidth: 100,
        backgroundColor: isCancel ? '#f1f5f9' : isDestructive ? '#ef4444' : '#0d9488',
      },
      text: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: isCancel ? '#64748b' : '#ffffff',
      },
    };
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <BlurView intensity={20} tint="dark" style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <TouchableWithoutFeedback onPress={hide}>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={{
            width: '85%',
            maxWidth: 340,
            alignItems: 'center',
            borderRadius: 24,
            backgroundColor: '#ffffff',
            padding: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 10,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }}>
          <View
            style={{
              marginBottom: 16,
              height: 64,
              width: 64,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 32,
              backgroundColor: iconConfig.bgColor 
            }}>
            <Ionicons name={iconConfig.name} size={32} color={iconConfig.color} />
          </View>

          <Text style={{ marginBottom: 8, textAlign: 'center', fontSize: 20, fontWeight: 'bold', color: '#1e293b' }}>{title}</Text>
          {message && (
            <Text style={{ marginBottom: 8, textAlign: 'center', fontSize: 15, lineHeight: 22, color: '#64748b' }}>
              {message}
            </Text>
          )}

          <View style={{ marginTop: 16, width: '100%', flexDirection: buttons.length > 2 ? 'column' : 'row', gap: 12 }}>
            {buttons.map((button, index) => {
              const buttonStyle = getButtonStyle(button.style, index, buttons.length);
              return (
                <TouchableOpacity
                  key={index}
                  style={buttonStyle.container}
                  onPress={() => handleButtonPress(button)}
                  activeOpacity={0.8}>
                  <Text style={buttonStyle.text}>{button.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}
