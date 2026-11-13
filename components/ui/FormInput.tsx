import { useState } from "react";
import { TextInput, View, type TextInputProps } from "react-native";
import { getTheme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";
import type { Validator } from "../../utils/formValidation";
import { FormError } from "./FormError";

export type FormInputProps = TextInputProps & { error?: string; validate?: Validator };
export function FormInput({ error, validate, value, style, onChangeText, onBlur, ...props }: FormInputProps) {
  const theme = getTheme(useColorScheme());
  const [touched, setTouched] = useState(false);
  const liveError = validate && (touched || !!value) ? validate(value ?? "") : "";
  const message = liveError || error;
  return <View style={{ width: "100%", gap: 6 }}>
    <TextInput {...props} value={value}
      onChangeText={text => { setTouched(true); onChangeText?.(text); }}
      onBlur={event => { setTouched(true); onBlur?.(event); }}
      style={[style, message ? { borderColor: theme.error, borderWidth: 1 } : undefined]}/>
    <FormError inline message={message}/>
  </View>;
}
