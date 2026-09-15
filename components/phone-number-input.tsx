import React, { useState } from "react";
import {
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { getTheme } from "../constants/theme";
import { useColorScheme } from "../hooks/use-color-scheme";
import { formatPhoneNumber, getNationalPhoneNumber, getPhoneCountry, type PhoneCountry } from "../utils/phoneNumber";

interface PhoneNumberInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  editable?: boolean;
}

const COUNTRY_CODES = {
  MY: {
    name: "Malaysia",
    code: "+60",
    flag: "🇲🇾",
  },
  ID: {
    name: "Indonesia",
    code: "+62",
    flag: "🇮🇩",
  },
};

export function PhoneNumberInput({
  value,
  onChangeText,
  placeholder = "123456789",
  error,
  editable = true,
}: PhoneNumberInputProps) {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const [selectedCode, setCountryCode] = useState<PhoneCountry>("MY");
  const countryCode = getPhoneCountry(value) ?? selectedCode;
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const handlePhoneChange = (text: string) => {
    const nextCountry = getPhoneCountry(text) ?? countryCode;
    setCountryCode(nextCountry);
    onChangeText(formatPhoneNumber(text, nextCountry));
  };

  const handleCountryChange = (code: PhoneCountry) => {
    if (!editable) return;
    setCountryCode(code);
    setDropdownVisible(false);
    onChangeText(formatPhoneNumber(value, code));
  };

  // Extract just the number part for display in input
  const phoneNumberOnly = getNationalPhoneNumber(value);
  const selectedCountry = COUNTRY_CODES[countryCode];

  return (
    <View style={styles.container}>
      {/* Country Selector and Phone Input */}
      <View
        style={[
          styles.inputWrapper,
          {
            borderColor: error ? theme.error : theme.border,
          },
        ]}
      >
        {/* Country Dropdown */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Pilih negara: ${selectedCountry.name} ${selectedCountry.code}`}
          accessibilityState={{ disabled: !editable, expanded: dropdownVisible }}
          disabled={!editable}
          onPress={() => setDropdownVisible(true)}
          style={[
            styles.countryDropdown,
            {
              borderRightColor: theme.border,
              backgroundColor: theme.secondary + "10",
            },
          ]}
        >
          <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
          <Text style={[styles.countryName, { color: theme.text }]}>
            {selectedCountry.name}
          </Text>
          <Text style={[styles.dropdownArrow, { color: theme.secondary }]}>
            ▼
          </Text>
        </TouchableOpacity>

        {/* Phone Prefix and Input */}
        <View style={styles.phoneInputContainer}>
          <Text style={[styles.prefix, { color: theme.secondary }]}>
            {selectedCountry.code}
          </Text>
          <TextInput
            accessibilityLabel="Nombor telefon"
            editable={editable}
            style={[
              styles.input,
              {
                color: theme.text,
              },
            ]}
            placeholder={placeholder}
            placeholderTextColor={theme.secondary}
            value={phoneNumberOnly}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Dropdown Menu */}
      <Modal
        visible={dropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setDropdownVisible(false)}
        >
          <View
            style={[
              styles.dropdown,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}
          >
            {Object.entries(COUNTRY_CODES).map(([key, country]) => (
              <TouchableOpacity
                key={key}
                accessibilityRole="button"
                accessibilityLabel={`${country.name} ${country.code}`}
                accessibilityState={{ selected: countryCode === key, disabled: !editable }}
                disabled={!editable}
                onPress={() => handleCountryChange(key as "MY" | "ID")}
                style={[
                  styles.dropdownItem,
                  {
                    backgroundColor:
                      countryCode === key
                        ? theme.primary + "15"
                        : "transparent",
                    borderBottomColor: theme.border,
                  },
                ]}
              >
                <Text style={styles.dropdownItemFlag}>{country.flag}</Text>
                <Text
                  style={[
                    styles.dropdownItemText,
                    {
                      color: countryCode === key ? theme.primary : theme.text,
                      fontWeight: countryCode === key ? "700" : "500",
                    },
                  ]}
                >
                  {country.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {error && (
        <Text style={[styles.error, { color: theme.error }]}>{error}</Text>
      )}
      <Text style={[styles.hint, { color: theme.secondary }]}>
        Pilih negara (MY / ID) dan masukkan nombor telefon anda.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  countryDropdown: {
    maxWidth: '52%',
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
    borderRightWidth: 1,
  },
  countryFlag: {
    fontSize: 18,
  },
  countryName: {
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  dropdownArrow: {
    fontSize: 10,
    marginLeft: 4,
  },
  phoneInputContainer: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 6,
  },
  prefix: {
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    minWidth: 200,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
  },
  dropdownItemFlag: {
    fontSize: 18,
  },
  dropdownItemText: {
    fontSize: 15,
  },
  error: {
    fontSize: 12,
    fontWeight: "500",
  },
  hint: {
    fontSize: 12,
    fontStyle: "italic",
  },
});
