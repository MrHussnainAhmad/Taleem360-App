import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle, TextStyle, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Input({
  label,
  error,
  containerStyle,
  labelStyle,
  inputStyle,
  icon,
  ...props
}: InputProps) {
  const isDark = useColorScheme() === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;
  
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPassword = props.secureTextEntry !== undefined;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: themeColors.text }, labelStyle]}>
          {label}
        </Text>
      )}
      
      <View style={[
        styles.inputWrapper,
        {
          backgroundColor: themeColors.surface,
          borderColor: error ? themeColors.error : isFocused ? themeColors.accent : themeColors.border,
          borderWidth: 1,
        }
      ]}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          style={[
            styles.input,
            { color: themeColors.text },
            icon ? styles.inputWithIcon : undefined,
            inputStyle
          ]}
          placeholderTextColor={themeColors.textMuted}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
          secureTextEntry={isPassword ? !isPasswordVisible : props.secureTextEntry}
        />
        {isPassword && (
          <TouchableOpacity 
            style={styles.eyeIconContainer} 
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            <Ionicons 
              name={isPasswordVisible ? 'eye-off' : 'eye'} 
              size={20} 
              color={themeColors.textMuted} 
            />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text style={[styles.error, { color: themeColors.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: Spacing.ms,
  },
  label: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.xs,
    letterSpacing: 0.4,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    minHeight: 48,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  inputWithIcon: {
    paddingLeft: Spacing.xs,
  },
  iconContainer: {
    paddingLeft: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    marginTop: Spacing.xs,
  },
  eyeIconContainer: {
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
