import React, { useState } from 'react';
import { TextInput, View, Text, Pressable, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type InputProps = {
  label?: string;
  isPassword?: boolean;
  error?: string;
} & Omit<TextInputProps, 'className'>;

export function Input({ label, isPassword = false, error, onFocus, onBlur, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);
  const [secure, setSecure] = useState(isPassword);

  const handleFocus = (e: any) => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setFocused(false);
    onBlur?.(e);
  };

  return (
    <View className="mb-4 w-full">
      {label && <Text className="mb-1.5 ml-1 text-sm font-medium text-slate-700">{label}</Text>}

      <View
        className={`
          h-12 flex-row items-center rounded-2xl border bg-white px-4
          ${focused ? 'border-primary-500' : 'border-slate-200'}
          ${error ? 'border-red-500' : ''}
        `}>
        <TextInput
          {...props}
          secureTextEntry={secure}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="h-full flex-1 text-xl text-slate-900"
          placeholderTextColor="#94a3b8"
          style={{
            paddingTop: 0,
            paddingBottom: 0,
            lineHeight: 20,
            height: '100%',
          }}
        />

        {isPassword && (
          <Pressable onPress={() => setSecure(!secure)} hitSlop={10}>
            <Ionicons name={secure ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94a3b8" />
          </Pressable>
        )}
      </View>

      {error && <Text className="ml-1 mt-1 text-xs font-medium text-red-500">{error}</Text>}
    </View>
  );
}
