import { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen } from '@/components/layout/Screen';
import { StandardHeader } from '@/components/layout/StandardHeader';
import { useTheme } from '@/hooks/useTheme';
import { assistantApi, type ChatMessage } from '@/modules/assistant/assistant.api';
import type { HomeStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const SUGGESTIONS = [
  'Abdest nasıl alınır?',
  'Namazda okunan dualar nelerdir?',
  'Seferi namaz nedir?',
  'Kaza namazı nasıl kılınır?',
];

export default function AssistantScreen() {
  const navigation = useNavigation<Nav>();
  const { isDark } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const next: ChatMessage[] = [...messages, { role: 'user', text: trimmed }];
    setMessages(next);
    setInput('');
    setLoading(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      const res = await assistantApi.chat(next);
      const reply = res.data?.data?.reply as string | undefined;
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: reply ?? 'Üzgünüm, şu an yanıt veremiyorum. Lütfen tekrar dener misin?',
        },
      ]);
    } catch (e: any) {
      const msg =
        e?.response?.status === 503
          ? 'AI asistanı şu anda kullanılamıyor.'
          : 'Bir hata oluştu, lütfen tekrar dene.';
      setMessages((prev) => [...prev, { role: 'model', text: msg }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  };

  return (
    <Screen safeAreaEdges={['left', 'right']} keyboardAvoiding={false}>
      <StandardHeader title="Sor" navigation={navigation} />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}>
          {messages.length === 0 && (
            <View className="mt-6 items-center gap-4">
              <View className="h-16 w-16 items-center justify-center rounded-3xl bg-teal-50 dark:bg-teal-500/15">
                <Ionicons name="sparkles" size={28} color={isDark ? '#2dd4bf' : '#0f766e'} />
              </View>
              <Text className="text-center text-base font-bold text-slate-700 dark:text-slate-200">
                İslam, namaz ve ibadet hakkında{'\n'}merak ettiğini sor
              </Text>
              <View className="mt-2 w-full gap-2">
                {SUGGESTIONS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    activeOpacity={0.8}
                    onPress={() => send(s)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                    <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {messages.map((m, i) => (
            <View
              key={i}
              className={`max-w-[85%] rounded-3xl px-4 py-3 ${
                m.role === 'user'
                  ? 'self-end bg-teal-600 dark:bg-teal-500'
                  : 'self-start border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
              }`}>
              <Text
                className={`text-[15px] leading-6 ${
                  m.role === 'user'
                    ? 'font-semibold text-white'
                    : 'text-slate-800 dark:text-slate-100'
                }`}>
                {m.text}
              </Text>
            </View>
          ))}

          {loading && (
            <View className="self-start rounded-3xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <ActivityIndicator size="small" color={isDark ? '#2dd4bf' : '#0f766e'} />
            </View>
          )}
        </ScrollView>

        <View className="flex-row items-end gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950">
          <TextInput
            className="max-h-28 flex-1 rounded-3xl border border-slate-200 bg-white px-4 py-2.5 text-[15px] text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            placeholder="Soru yaz…"
            placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
            value={input}
            onChangeText={setInput}
            multiline
            editable={!loading}
          />
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={loading || !input.trim()}
            onPress={() => send(input)}
            className={`h-11 w-11 items-center justify-center rounded-full ${
              input.trim() && !loading ? 'bg-teal-600 dark:bg-teal-500' : 'bg-slate-300 dark:bg-slate-700'
            }`}>
            <Ionicons name="arrow-up" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
