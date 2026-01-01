import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { View, ViewProps, KeyboardAvoidingView, Platform } from 'react-native';

type ScreenProps = ViewProps & {
  children: React.ReactNode;
  safeAreaEdges?: Edge[];
  keyboardAvoiding?: boolean;
};

export function Screen({ children, className = '', style, keyboardAvoiding = true, safeAreaEdges, ...props }: ScreenProps) {
  // Default edges: Android'de top edge'i kaldırıyoruz çünkü navigation header zaten bunu hallediyor
  // iOS'ta top edge'i ekliyoruz çünkü status bar için boşluk gerekli
  const defaultEdges: Edge[] = Platform.OS === 'ios' ? ['top', 'left', 'right'] : ['left', 'right'];
  const edges = safeAreaEdges ?? defaultEdges;

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
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}
