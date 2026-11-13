import type { TextInputInstance } from "react-native";
import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { getTheme } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';

export function OtpCodeInput({ value, onChange, disabled, hasError, onSubmit }: {
  value: string[];
  onChange: (digits: string[]) => void;
  disabled?: boolean;
  hasError?: boolean;
  onSubmit?: () => void;
}) {
  const theme = getTheme(useColorScheme());
  const [focused, setFocused] = useState<number | null>(null);
  const inputs = useRef<(TextInputInstance | null)[]>([]);

  function change(index: number, text: string) {
    if (disabled) return;
    const digits = text.replace(/[^0-9]/g, '').slice(0, 6);
    const next = [...value];
    const start = digits.length === 6 ? 0 : index;
    if (!digits) next[index] = '';
    else digits.split('').forEach((digit, offset) => { if (start + offset < 6) next[start + offset] = digit; });
    onChange(next);
    if (digits) inputs.current[Math.min(start + digits.length, 5)]?.focus();
  }

  return (
    <View style={styles.row}>
      {value.map((digit, index) => (
        <TextInput
          key={index}
          ref={input => { inputs.current[index] = input; }}
          accessibilityLabel={`Digit OTP ${index + 1} dari 6`}
          value={digit}
          onChangeText={text => change(index, text)}
          onKeyPress={({ nativeEvent }) => {
            if (nativeEvent.key === 'Backspace' && !digit && index > 0) {
              const next = [...value];
              next[index - 1] = '';
              onChange(next);
              inputs.current[index - 1]?.focus();
            }
          }}
          keyboardType="number-pad"
          autoComplete={index === 0 ? 'sms-otp' : 'off'}
          textContentType={index === 0 ? 'oneTimeCode' : 'none'}
          onFocus={() => setFocused(index)}
          onBlur={() => setFocused(current => current === index ? null : current)}
          onSubmitEditing={onSubmit}
          returnKeyType={index === 5 ? "done" : "next"}
          selectTextOnFocus
          autoCorrect={false}
          editable={!disabled}
          maxLength={6}
          placeholder="0"
          placeholderTextColor={theme.secondary}
          style={[styles.digit, { color: theme.text, backgroundColor: focused === index ? theme.communityBg : theme.accent, borderColor: hasError ? theme.error : focused === index ? theme.primary : theme.border }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, width: '100%' },
  digit: { flex: 1, minWidth: 0, height: 54, borderWidth: 1, borderRadius: 10, textAlign: 'center', fontSize: 24, paddingHorizontal: 0 },
});
