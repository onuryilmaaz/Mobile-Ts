import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useSSO, useAuth } from '@clerk/clerk-expo';
import { useAuthStore } from '@/modules/auth/auth.store';
import { authApi } from '@/modules/auth/auth.api';
import { FontAwesome5 } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '@/hooks/useTheme';
import Svg, { Path } from 'react-native-svg';

WebBrowser.maybeCompleteAuthSession();

type SocialProvider = 'oauth_google' | 'oauth_apple';

type SocialAuthProps = {
  onError: (message: string) => void;
};

const GoogleIcon = ({ size = 18 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <Path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <Path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <Path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </Svg>
);

export function SocialAuth({ onError }: SocialAuthProps) {
  const { isDark } = useTheme();
  const { startSSOFlow } = useSSO();
  const { getToken, isSignedIn, signOut } = useAuth();
  const login = useAuthStore((s) => s.login);
  const [loading, setLoading] = useState<SocialProvider | null>(null);

  React.useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const exchangeClerkTokenForBackend = async () => {
    const sessionToken = await getToken();
    if (!sessionToken) throw new Error('Clerk oturum tokenı alınamadı.');
    const { data } = await authApi.clerkLogin(sessionToken);
    await login(data.user, data.accessToken, data.refreshToken);
  };

  const handleSocialLogin = async (strategy: SocialProvider) => {
    try {
      setLoading(strategy);

      if (isSignedIn) {
        try {
          await exchangeClerkTokenForBackend();
          return;
        } catch (e) {
          try {
            await signOut();
          } catch {
            console.error('Mevcut oturumu kapatırken hata oluştu, devam ediliyor...', e);
          }
        }
      }

      const { createdSessionId, setActive } = await startSSOFlow({
        strategy,
        redirectUrl: 'salah://callback',
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        await exchangeClerkTokenForBackend();
      } else {
        throw new Error('Giriş başarısız oldu.');
      }
    } catch (err: any) {
      console.error('Social Auth Error:', err);
      let errMsg = 'Giriş yapılırken bir hata oluştu.';
      if (err?.response?.data?.message) {
        errMsg = err.response.data.message;
      } else if (err?.message) {
        errMsg = err.message;
      }
      onError(errMsg);
    } finally {
      setLoading(null);
    }
  };

  return (
    <View className="mt-4 w-full flex-col gap-3">
      <View className="my-2 flex-row items-center">
        <View className="h-[1px] flex-1 bg-slate-200 dark:bg-white/10" />
        <Text className="mx-3 text-sm font-medium text-slate-500 dark:text-slate-400">veya</Text>
        <View className="h-[1px] flex-1 bg-slate-200 dark:bg-white/10" />
      </View>

      <TouchableOpacity
        onPress={() => handleSocialLogin('oauth_google')}
        disabled={loading !== null}
        activeOpacity={0.8}
        className="h-12 w-full flex-row items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 dark:border-white/10 dark:bg-slate-800/50">
        {loading === 'oauth_google' ? (
          <ActivityIndicator size="small" color="#0d9488" />
        ) : (
          <>
            <GoogleIcon size={18} />
            <Text className="ml-3 text-base font-semibold text-slate-800 dark:text-white">
              Google ile devam et
            </Text>
          </>
        )}
      </TouchableOpacity>

      {(Platform.OS === 'ios' || Platform.OS === 'android') && (
        <TouchableOpacity
          onPress={() => handleSocialLogin('oauth_apple')}
          disabled={loading !== null}
          activeOpacity={0.8}
          className="h-12 w-full flex-row items-center justify-center rounded-2xl bg-black px-4 dark:bg-white">
          {loading === 'oauth_apple' ? (
            <ActivityIndicator size="small" color={isDark ? '#000000' : '#ffffff'} />
          ) : (
            <>
              <FontAwesome5 name="apple" size={20} color={isDark ? '#000000' : '#ffffff'} />
              <Text className="ml-3 text-base font-semibold text-white dark:text-black">
                Apple ile devam et
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}
