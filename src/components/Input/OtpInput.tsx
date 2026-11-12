import React, { useRef, useState } from "react";
import {
  TextInput,
  type TextInputInstance,
  type TextInputKeyPressEvent,
  View,
} from "react-native";
import { moderateScale } from "react-native-size-matters";
import { FONTS, makeStyles, useTheme } from "@/theme";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (val: string) => void;
  autoFocus?: boolean;
  placeholder?: string;
  cellSize?: number;
}

const OtpInput: React.FC<OtpInputProps> = ({
  length = 4,
  value,
  onChange,
  autoFocus = false,
  placeholder = "",
  cellSize,
}) => {
  const inputs = useRef<(TextInputInstance | null)[]>([]);
  const [focusIndex, setFocusIndex] = useState(autoFocus ? 0 : -1);
  const styles = useStyles();
  const { colors } = useTheme();

  const setCharAt = (i: number, c: string) => {
    const next = value.split("");
    while (next.length < length) next.push("");
    next[i] = c;
    onChange(next.slice(0, length).join(""));
  };

  const handleChange = (text: string, index: number) => {
    if (text.length > 1) {
      const chars = text.replace(/\s/g, "").split("").slice(0, length);
      onChange(chars.join("").padEnd(length, "").slice(0, length).trim());
      const next = Math.min(chars.length, length - 1);
      inputs.current[next]?.focus();
      return;
    }
    setCharAt(index, text);
    if (text && index < length - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (
    e: TextInputKeyPressEvent,
    index: number,
  ) => {
    if (e.nativeEvent.key === "Backspace" && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus();
      setCharAt(index - 1, "");
    }
  };

  return (
    <View style={styles.row}>
      {Array.from({ length }).map((_, i) => {
        const char = value[i] ?? "";
        const active = focusIndex === i;
        return (
          <TextInput
            maxFontSizeMultiplier={1.3}
            accessibilityLabel={`Digit ${i + 1} of ${length}`}
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            key={i}
            ref={(r) => {
              inputs.current[i] = r;
            }}
            value={char}
            onChangeText={(t) => handleChange(t, i)}
            onKeyPress={(e) => handleKeyPress(e, i)}
            onFocus={() => setFocusIndex(i)}
            onBlur={() => setFocusIndex(-1)}
            keyboardType="number-pad"
            maxLength={1}
            autoFocus={autoFocus && i === 0}
            placeholder={placeholder}
            style={[
              styles.cell,
              cellSize
                ? { width: cellSize, height: cellSize }
                : null,
              { borderColor: active ? colors.primary : colors.inputBorder },
            ]}
            selectionColor={colors.primary}
            placeholderTextColor={colors.textPlaceholder}
          />
        );
      })}
    </View>
  );
};

export default OtpInput;

const useStyles = makeStyles((c) => ({
  row: {
    flexDirection: "row",
    gap: moderateScale(12),
  },
  cell: {
    flex: 1,
    height: moderateScale(60),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    backgroundColor: c.surface,
    textAlign: "center",
    color: c.text,
    fontFamily: FONTS.regular,
    fontWeight: "400",
    fontSize: moderateScale(14, 0.3),
  },
}));
