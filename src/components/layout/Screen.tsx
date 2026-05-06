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

  const appBg = isDark ? '#0b1220' : '#f8fafc';

  const content = (
    <View className="flex-1" style={style} {...props}>
      {children}
    </View>
  );

  return (
    <SafeAreaView
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      style={[{ backgroundColor: appBg }, style]}
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

// import { SafeAreaView, Edge } from 'react-native-safe-area-context';
// import { View, ViewProps, KeyboardAvoidingView, Platform } from 'react-native';
// import { useThemeStore } from '@/store/theme.store';

// type ScreenProps = ViewProps & {
//   children: React.ReactNode;
//   safeAreaEdges?: Edge[];
//   keyboardAvoiding?: boolean;
// };

// export function Screen({
//   children,
//   style,
//   keyboardAvoiding = true,
//   safeAreaEdges,
//   ...props
// }: ScreenProps) {
//   const { isDark } = useThemeStore();
//   const defaultEdges: Edge[] = Platform.OS === 'ios' ? ['left', 'right'] : ['left', 'right'];
//   const edges = safeAreaEdges ?? defaultEdges;

//   const appBg = isDark ? '#0b1220' : '#f8fafc';

//   const content = (
//     <View className="flex-1" style={style} {...props}>
//       {children}
//     </View>
//   );

//   // 🔥 SafeAreaView'i try-catch ile sar
//   try {
//     return (
//       <SafeAreaView
//         className="flex-1 bg-slate-50 dark:bg-slate-950"
//         style={[{ backgroundColor: appBg }, style]}
//         edges={edges}>
//         {keyboardAvoiding ? (
//           <KeyboardAvoidingView
//             className="flex-1"
//             behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//             keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
//             enabled={Platform.OS === 'ios'}>
//             {content}
//           </KeyboardAvoidingView>
//         ) : (
//           content
//         )}
//       </SafeAreaView>
//     );
//   } catch (error) {
//     // SafeAreaView henüz hazır değilse, basit bir View döndür
//     console.log('SafeAreaView not ready yet, using fallback');
//     return (
//       <View className="flex-1" style={[{ backgroundColor: appBg }, style]}>
//         {content}
//       </View>
//     );
//   }
// }
