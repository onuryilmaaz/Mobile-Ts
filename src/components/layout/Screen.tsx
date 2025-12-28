import { SafeAreaView } from 'react-native-safe-area-context';
import { View, ViewProps, StatusBar } from 'react-native';

type ScreenProps = ViewProps & {
  children: React.ReactNode;
  safeAreaEdges?: ('top' | 'right' | 'bottom' | 'left')[];
};

export function Screen({ children, className = '', style, ...props }: ScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <View className={`flex-1 px-4 ${className}`} style={style} {...props}>
        {children}
      </View>
    </SafeAreaView>
  );
}
