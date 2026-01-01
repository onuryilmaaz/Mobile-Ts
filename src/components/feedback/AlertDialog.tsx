import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAlertStore, AlertType, AlertButton } from '@/store/alert.store';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

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
  }, [visible]);

  const handleButtonPress = async (button: AlertButton) => {
    if (button.onPress) {
      await button.onPress();
    }
    hide();
  };

  const iconConfig = getIconConfig(type);

  const getButtonStyle = (style?: 'default' | 'cancel' | 'destructive', index?: number, total?: number) => {
    const isCancel = style === 'cancel';
    const isDestructive = style === 'destructive';
    
    return {
      container: [
        styles.button,
        isCancel && styles.buttonCancel,
        isDestructive && styles.buttonDestructive,
        !isCancel && !isDestructive && styles.buttonPrimary,
      ],
      text: [
        styles.buttonText,
        isCancel && styles.buttonTextCancel,
        isDestructive && styles.buttonTextDestructive,
        !isCancel && !isDestructive && styles.buttonTextPrimary,
      ],
    };
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <BlurView intensity={20} tint="dark" style={styles.overlay}>
        <TouchableWithoutFeedback onPress={hide}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: iconConfig.bgColor }]}>
            <Ionicons name={iconConfig.name} size={32} color={iconConfig.color} />
          </View>

          {/* Content */}
          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}

          {/* Buttons */}
          <View style={[styles.buttonContainer, buttons.length > 2 && styles.buttonContainerVertical]}>
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  container: {
    width: width * 0.85,
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
    width: '100%',
  },
  buttonContainerVertical: {
    flexDirection: 'column',
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
  },
  buttonPrimary: {
    backgroundColor: '#0d9488',
  },
  buttonCancel: {
    backgroundColor: '#f1f5f9',
  },
  buttonDestructive: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextPrimary: {
    color: '#ffffff',
  },
  buttonTextCancel: {
    color: '#64748b',
  },
  buttonTextDestructive: {
    color: '#ffffff',
  },
});

