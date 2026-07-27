import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Linking, Platform, Dimensions } from 'react-native';
import Constants from 'expo-constants';
import { apiClient } from '@/utils/api';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '@/constants/theme';

const themeColors = Colors.light;

const { width } = Dimensions.get('window');

interface VersionGuardProps {
  children: React.ReactNode;
}

export function VersionGuard({ children }: VersionGuardProps) {
  const [showGentle, setShowGentle] = useState(false);
  const [showForce, setShowForce] = useState(false);

  useEffect(() => {
    checkVersion();
  }, []);

  const checkVersion = async () => {
    try {
      const res = await apiClient('/api/public/app-version');
      const targetVersion = res.version;
      const localVersion = Constants.expoConfig?.version || '1.0.0';
      
      const targetInt = parseVersion(targetVersion);
      const localInt = parseVersion(localVersion);
      const difference = targetInt - localInt;

      if (difference === 2) {
        setShowGentle(true);
      } else if (difference >= 3) {
        setShowForce(true);
      }
    } catch (e) {
      // Fail silently for version checks
    }
  };

  const parseVersion = (v: string) => {
    if (!v) return 0;
    const parts = v.split('.').map(Number);
    return (parts[0] || 0) * 10000 + (parts[1] || 0) * 100 + (parts[2] || 0);
  };

  const openStore = () => {
    if (Platform.OS === 'android') {
      Linking.openURL('market://details?id=com.hussnainahmadsahi.nisaab360');
    } else {
      Linking.openURL('itms-apps://itunes.apple.com/app/idYOUR_APP_ID'); 
    }
  };

  const ModernModal = ({ 
    visible, 
    title, 
    message, 
    icon,
    primaryAction,
    secondaryAction 
  }: any) => (
    <Modal visible={visible} transparent animationType="fade">
      <BlurView intensity={30} tint="dark" style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={[themeColors.primary, themeColors.accent]}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={icon} size={32} color="#fff" />
            </LinearGradient>
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.actions}>
            {secondaryAction && (
              <TouchableOpacity 
                style={styles.buttonSecondary} 
                onPress={secondaryAction.onPress}
                activeOpacity={0.7}
              >
                <Text style={styles.buttonTextSecondary}>{secondaryAction.label}</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.buttonPrimaryContainer, !secondaryAction && { flex: 1 }]} 
              onPress={primaryAction.onPress}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[themeColors.primary, themeColors.accent]}
                style={styles.buttonPrimaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.buttonTextPrimary}>{primaryAction.label}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );

  return (
    <>
      {children}
      
      <ModernModal
        visible={showGentle}
        icon="rocket-outline"
        title="Update Available"
        message="A shiny new version of the app is available! Update now to get the latest features and improvements."
        primaryAction={{ label: "Update Now", onPress: openStore }}
        secondaryAction={{ label: "Maybe Later", onPress: () => setShowGentle(false) }}
      />

      <ModernModal
        visible={showForce}
        icon="cloud-download-outline"
        title="Update Required"
        message="A critical update is required to continue using the app. Please update to the latest version to proceed."
        primaryAction={{ label: "Update Now", onPress: openStore }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: themeColors.surface,
    padding: 32,
    borderRadius: 24,
    width: width * 0.85,
    maxWidth: 400,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  iconContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: themeColors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  title: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.fontFamilyBold,
    color: themeColors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamilyMedium,
    color: themeColors.textMuted,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  buttonSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: themeColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  buttonTextSecondary: {
    color: themeColors.textMuted,
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.md,
  },
  buttonPrimaryContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonPrimaryGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonTextPrimary: {
    color: '#FFFFFF',
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.md,
  },
});
