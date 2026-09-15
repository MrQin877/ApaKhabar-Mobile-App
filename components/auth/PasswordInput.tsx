import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, type TextInputProps } from 'react-native';
import { getTheme } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';

export function PasswordInput({ style, editable = true, ...props }: Omit<TextInputProps, 'secureTextEntry'>) {
  const [visible, setVisible] = useState(false);
  const theme = getTheme(useColorScheme());

  return (
    <View style={styles.container}>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        {...props}
        editable={editable}
        secureTextEntry={!visible}
        style={[style, styles.input]}
      />
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Sembunyikan kata laluan' : 'Tunjukkan kata laluan'}
        accessibilityState={{ disabled: !editable }}
        disabled={!editable}
        onPress={() => setVisible(current => !current)}
        style={styles.toggle}
      >
        <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.secondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', width: '100%' },
  input: { paddingRight: 52 },
  toggle: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 48, alignItems: 'center', justifyContent: 'center' },
});
