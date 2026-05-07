import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { View, ViewProps, KeyboardAvoidingView, Platform } from 'react-native';

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
  const defaultEdges: Edge[] = ['left', 'right'];
  const edges = safeAreaEdges ?? defaultEdges;

  const content = (
    <View className="flex-1" style={style} {...props}>
      {children}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={edges}>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
          enabled={Platform.OS === 'ios'}>
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}
