import {
  createNavigationContainerRef,
  type NavigationContainerRefWithCurrent,
} from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const rootNavigationRef: NavigationContainerRefWithCurrent<RootStackParamList> =
  createNavigationContainerRef<RootStackParamList>();

export function rootNavigate<RouteName extends keyof RootStackParamList>(
  ...args: undefined extends RootStackParamList[RouteName]
    ? [screen: RouteName] | [screen: RouteName, params: RootStackParamList[RouteName]]
    : [screen: RouteName, params: RootStackParamList[RouteName]]
) {
  if (!rootNavigationRef.isReady()) return;
  // @ts-expect-error react-navigation typing is variadic; runtime is safe
  rootNavigationRef.navigate(...args);
}

export function rootReset(name: keyof RootStackParamList, params?: object) {
  if (!rootNavigationRef.isReady()) return;
  rootNavigationRef.reset({
    index: 0,
    routes: [{ name, params }],
  });
}

