import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useSSO, useAuth } from '@clerk/clerk-expo';
import { useAuthStore } from '@/modules/auth/auth.store';
import { authApi } from '@/modules/auth/auth.api';
import { FontAwesome5 } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '@/hooks/useTheme';

WebBrowser.maybeCompleteAuthSession();

type SocialProvider = 'oauth_google' | 'oauth_apple';

type SocialAuthProps = {
  onError: (message: string) => void;
};

export function SocialAuth({ onError }: SocialAuthProps) {
  const { isDark } = useTheme();
  const { startSSOFlow } = useSSO();
  const { getToken } = useAuth();
  const login = useAuthStore((s) => s.login);
  const [loading, setLoading] = useState<SocialProvider | null>(null);

  React.useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const handleSocialLogin = async (strategy: SocialProvider) => {
    try {
      setLoading(strategy);

      const { createdSessionId, setActive } = await startSSOFlow({
        strategy,
        redirectUrl: 'salah://callback',
      });

      if (createdSessionId && setActive) {
        // Set the session active in Clerk
        await setActive({ session: createdSessionId });

        // Retrieve Clerk session token (JWT)
        const sessionToken = await getToken();

        if (!sessionToken) {
          throw new Error('Clerk oturum tokenı alınamadı.');
        }

        // Send token to backend to log in / register and get backend JWTs
        const { data } = await authApi.clerkLogin(sessionToken);

        // Login inside local auth store
        await login(data.user, data.accessToken, data.refreshToken);
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
    <View className="w-full mt-4 flex-col gap-3">
      {/* Divider */}
      <View className="flex-row items-center my-2">
        <View className="flex-1 h-[1px] bg-slate-200 dark:bg-white/10" />
        <Text className="mx-3 text-sm text-slate-500 dark:text-slate-400 font-medium">veya</Text>
        <View className="flex-1 h-[1px] bg-slate-200 dark:bg-white/10" />
      </View>

      {/* Google Sign In */}
      <TouchableOpacity
        onPress={() => handleSocialLogin('oauth_google')}
        disabled={loading !== null}
        activeOpacity={0.8}
        className="w-full h-12 flex-row items-center justify-center border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/50 rounded-2xl px-4">
        {loading === 'oauth_google' ? (
          <ActivityIndicator size="small" color="#0d9488" />
        ) : (
          <>
            <FontAwesome5 name="google" size={18} color="#EA4335" />
            <Text className="ml-3 font-semibold text-slate-800 dark:text-white text-base">
              Google ile devam et
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Apple Sign In */}
      {(Platform.OS === 'ios' || Platform.OS === 'android') && (
        <TouchableOpacity
          onPress={() => handleSocialLogin('oauth_apple')}
          disabled={loading !== null}
          activeOpacity={0.8}
          className="w-full h-12 flex-row items-center justify-center bg-black dark:bg-white rounded-2xl px-4">
          {loading === 'oauth_apple' ? (
            <ActivityIndicator size="small" color={isDark ? '#000000' : '#ffffff'} />
          ) : (
            <>
              <FontAwesome5 name="apple" size={20} color={isDark ? '#000000' : '#ffffff'} />
              <Text className="ml-3 font-semibold text-white dark:text-black text-base">
                Apple ile devam et
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}
