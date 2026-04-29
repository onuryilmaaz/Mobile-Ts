import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { View, ViewProps, KeyboardAvoidingView, Platform } from 'react-native';
import { useAppTheme } from '@/constants/theme';

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
  const { colors } = useAppTheme();

  const defaultEdges: Edge[] = Platform.OS === 'ios' ? ['left', 'right'] : ['left', 'right'];
  const edges = safeAreaEdges ?? defaultEdges;

  const content = (
    <View style={[{ flex: 1 }, style]} {...props}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[{ backgroundColor: colors.bg }, { flex: 1 }]} edges={edges}>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
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
