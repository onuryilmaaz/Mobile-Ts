import React, { useRef, useState } from 'react';
import { View, TextInput, Pressable } from 'react-native';

type OtpInputProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
};

export function OtpInput({ length = 6, value, onChange, onComplete }: OtpInputProps) {
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    
    const newValue = value.split('');
    newValue[index] = digit;
    const result = newValue.join('').slice(0, length);
    onChange(result);

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (result.length === length && onComplete) {
      onComplete(result);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!value[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newValue = value.split('');
        newValue[index - 1] = '';
        onChange(newValue.join(''));
      } else {
        const newValue = value.split('');
        newValue[index] = '';
        onChange(newValue.join(''));
      }
    }
  };

  const handlePress = (index: number) => {
    inputRefs.current[index]?.focus();
  };

  return (
    <View className="flex-row justify-between gap-2">
      {Array.from({ length }).map((_, index) => {
        const isFocused = focusedIndex === index;
        const hasValue = !!value[index];

        return (
          <Pressable
            key={index}
            onPress={() => handlePress(index)}
            className={`
              h-14 flex-1 items-center justify-center rounded-xl border-2 bg-white
              ${isFocused ? 'border-primary-500' : hasValue ? 'border-primary-300' : 'border-slate-200'}
            `}>
            <TextInput
              ref={(ref) => { inputRefs.current[index] = ref; }}
              value={value[index] || ''}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(null)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              className="h-full w-full text-center text-2xl font-bold text-slate-900"
              style={{ padding: 0 }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

