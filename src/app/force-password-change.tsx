import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, useColorScheme, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient } from '@/utils/api';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { useAuth } from '@/context/AuthContext';

type ChangePasswordResponse = {
  accessToken?: string;
  refreshToken?: string;
};

export default function ForcePasswordChangeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const role = params.role as string;
  const { login } = useAuth();
  const isDark = useColorScheme() === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await apiClient('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword, returnTokens: true }),
      }) as ChangePasswordResponse;

      if ((role === 'STUDENT' || role === 'STAFF') && data.accessToken && data.refreshToken) {
        await login(role, data.accessToken, data.refreshToken);
      }

      Alert.alert(
        'Success',
        'Password changed successfully!',
        [
          {
            text: 'Continue',
            onPress: () => {
              if (role === 'STUDENT') {
                router.replace({ pathname: '/profile-suggestion', params: { role: 'STUDENT' } });
              } else if (role === 'STAFF') {
                router.replace({ pathname: '/profile-suggestion', params: { role: 'STAFF' } });
              } else {
                router.replace('/login');
              }
            }
          }
        ]
      );
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.keyboardRoot}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenShell
        title="Update Password"
        subtitle="For security reasons, change your password before continuing."
        eyebrow="Account security"
        icon={<Ionicons name="key-outline" color="#FFFFFF" size={22} />}
        scrollable={false}
        sheetStyle={styles.authSheet}
      >
      <View style={styles.contentWrapper}>

        <Card noPadding style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.form}>
              <Input
                label="Current Password"
                placeholder="••••••••"
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />

              <Input
                label="New Password"
                placeholder="••••••••"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />

              <Input
                label="Confirm New Password"
                placeholder="••••••••"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              
              {error ? (
                <View style={[styles.errorContainer, { backgroundColor: themeColors.errorBg, borderColor: themeColors.error }]}>
                  <Ionicons name="alert-circle" size={16} color={themeColors.error} />
                  <Text style={[styles.error, { color: themeColors.error }]}>{error}</Text>
                </View>
              ) : null}
              
              <Button
                title="Update Password"
                onPress={handleChangePassword}
                loading={isLoading}
                style={styles.submitButton}
                textStyle={{ fontFamily: Typography.fontFamilySemiBold }}
              />
              <Button
                title="Cancel & Logout"
                variant="ghost"
                onPress={() => router.replace('/login')}
                style={styles.cancelButton}
              />
            </View>
          </View>
        </Card>
      </View>
      </ScreenShell>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardRoot: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    paddingTop: Spacing.sm,
  },
  authSheet: {
    justifyContent: 'center',
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.xl,
    marginBottom: Spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    lineHeight: 20,
  },
  card: {
    marginBottom: 0,
  },
  cardContent: {
    padding: Spacing.xl,
  },
  form: {
    gap: Spacing.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  error: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    flex: 1,
  },
  submitButton: {
    marginTop: Spacing.sm,
    height: 44,
  },
  cancelButton: {
    height: 44,
  }
});
