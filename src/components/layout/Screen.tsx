import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { View, ViewProps, KeyboardAvoidingView, Platform } from 'react-native';
import { useThemeStore } from '@/store/theme.store';

type ScreenProps = ViewProps & {
  children: React.ReactNode;
  safeAreaEdges?: Edge[];
  keyboardAvoiding?: boolean;
};

export function Screen({
  children,
  style,
  keyboardAvoiding = true,
  safeAreaEdges,
  ...props
}: ScreenProps) {
  const { isDark } = useThemeStore();
  const defaultEdges: Edge[] = Platform.OS === 'ios' ? ['left', 'right'] : ['left', 'right'];
  const edges = safeAreaEdges ?? defaultEdges;

  const content = (
    <View className="flex-1" style={style} {...props}>
      {children}
    </View>
  );

  return (
    <SafeAreaView 
      className="flex-1 bg-white dark:bg-slate-900" 
      style={[{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }, style]}
      edges={edges}>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          enabled={Platform.OS === 'ios'}>
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}
