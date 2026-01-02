import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { View, ViewProps, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenProps = ViewProps & {
  children: React.ReactNode;
  safeAreaEdges?: Edge[];
  keyboardAvoiding?: boolean;
};

export function Screen({
  children,
  className = '',
  style,
  keyboardAvoiding = true,
  safeAreaEdges,
  ...props
}: ScreenProps) {
  const defaultEdges: Edge[] = Platform.OS === 'ios' ? ['top', 'left', 'right'] : ['left', 'right'];
  const edges = safeAreaEdges ?? defaultEdges;
  const insets = useSafeAreaInsets();

  const content = (
    <View className={`flex-1 px-4 ${className}`} style={style} {...props}>
      {children}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={edges}>
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
