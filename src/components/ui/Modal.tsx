import { useThemeColors } from '@/context/ThemePreferencesContext';
import React from 'react';
import { Modal as RNModal, View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, ViewStyle } from 'react-native';
import { Typography, Spacing, Radius, Shadows } from '@/constants/theme';

import { Ionicons } from '@expo/vector-icons';
interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  contentStyle?: ViewStyle;
}

export function Modal({ visible, onClose, title, children, footer, contentStyle }: ModalProps) {
  const themeColors = useThemeColors();

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[
              styles.container,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border },
              Shadows.md
            ]}>
              
              <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
                <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.closeButton} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <Ionicons name="close" size={20} color={themeColors.textMuted} />
                </TouchableOpacity>
              </View>
              
              <View style={[styles.content, contentStyle]}>
                {children}
              </View>
              
              {footer && (
                <View style={[styles.footer, { borderTopColor: themeColors.border, backgroundColor: themeColors.background }]}>
                  {footer}
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  container: {
    width: '100%',
    maxWidth: 500,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    flex: 1,
    fontFamily: Typography.fontFamilyDisplay,
    fontSize: Typography.size.lg,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  content: {
    padding: Spacing.md,
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  }
});
