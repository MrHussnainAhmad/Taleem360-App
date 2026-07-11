import { useThemeColors } from '@/context/ThemePreferencesContext';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl, TouchableOpacity, Alert, Image, Modal, TextInput } from 'react-native';
import { apiClient } from '@/utils/api';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { ProfileSkeleton } from '@/components/ui/Skeleton';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToCloudinary } from '@/utils/upload';
import { useAuth } from '@/context/AuthContext';

type StaffProfile = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  campusName: string | null;
  profilePictureUrl: string | null;
};

type Option = {
  id: number;
  name: string;
};

export default function ProfileScreen() {
  const themeColors = useThemeColors();
  const { logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  const [requestFirstName, setRequestFirstName] = useState('');
  const [requestLastName, setRequestLastName] = useState('');
  const [requestEmail, setRequestEmail] = useState('');
  const [requestPhone, setRequestPhone] = useState('');
  const [requestCampusId, setRequestCampusId] = useState<number | null>(null);
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  const [campusModalVisible, setCampusModalVisible] = useState(false);
  const [campusesList, setCampusesList] = useState<Option[]>([]);

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await apiClient('/api/staff/profile');
      setProfile(data.profile);
      setCampusesList(data.campuses || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'You need to allow access to your photos to upload a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setIsUploadingImage(true);
      try {
        const url = await uploadImageToCloudinary(result.assets[0].uri);
        await apiClient('/api/staff/profile', {
          method: 'PATCH',
          body: JSON.stringify({ profilePictureUrl: url }),
        });
        setProfile((prev) => prev ? { ...prev, profilePictureUrl: url } : null);
        Alert.alert('Success', 'Profile picture updated successfully.');
      } catch (err: any) {
        Alert.alert('Upload failed', err.message || 'Failed to upload profile picture.');
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  const handleSendRequest = async () => {
    if (!requestReason) {
      Alert.alert('Error', 'Please provide a reason for the change.');
      return;
    }
    setIsSendingRequest(true);
    try {
      await apiClient('/api/staff/profile-requests', {
        method: 'POST',
        body: JSON.stringify({
          firstName: requestFirstName || undefined,
          lastName: requestLastName || undefined,
          email: requestEmail || undefined,
          phone: requestPhone || undefined,
          campusId: requestCampusId || undefined,
          reason: requestReason,
        }),
      });
      Alert.alert('Success', 'Profile change request sent to admin.');
      setRequestModalVisible(false);
      setRequestReason('');
      setRequestFirstName('');
      setRequestLastName('');
      setRequestEmail('');
      setRequestPhone('');
      setRequestCampusId(null);
    } catch (err: any) {
      Alert.alert('Failed to send request', err.message || 'An error occurred');
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await apiClient('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      Alert.alert('Success', 'Password changed successfully.');
      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      Alert.alert('Failed to change password', err.message || 'An error occurred');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const renderField = (label: string, value: string | null | undefined) => (
    <View style={[styles.fieldRow, { borderBottomColor: themeColors.border }]}>
      <Text style={[styles.fieldLabel, { color: themeColors.textMuted }]}>{label}</Text>
      <Text style={[styles.fieldValue, { color: themeColors.text }]}>{value || '-'}</Text>
    </View>
  );

  return (
    <ScreenShell
      title="Profile"
      subtitle="Contact and campus information."
      eyebrow="Account"
      icon={<Ionicons name="person-outline" size={22} color="#FFFFFF" />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {loading && !refreshing ? (
        <ProfileSkeleton />
      ) : error ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: themeColors.error }]}>{error}</Text>
        </View>
      ) : profile ? (
        <>
          <View style={styles.header}>
            <TouchableOpacity onPress={handlePickImage} disabled={isUploadingImage}>
              <View style={[styles.avatar, { backgroundColor: themeColors.border }]}>
                {profile.profilePictureUrl ? (
                  <Image source={{ uri: profile.profilePictureUrl }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person-circle" color={themeColors.text} size={40} />
                )}
                {isUploadingImage && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                )}
              </View>
              <View style={styles.editBadge}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={[styles.name, { color: themeColors.text }]}>{profile.name}</Text>
            <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
              {profile.campusName || 'Staff Member'}
            </Text>
          </View>

          <Card title="Contact Information">
            <View style={styles.fieldsContainer}>
              {renderField("Email", profile.email)}
              {renderField("Phone", profile.phone)}
            </View>
          </Card>
          
          <Button 
            title="Request Profile Change" 
            onPress={() => setRequestModalVisible(true)} 
            variant="outline" 
            style={{ marginTop: Spacing.md }} 
          />

          <Button 
            title="Change Password" 
            onPress={() => setPasswordModalVisible(true)} 
            variant="outline" 
            style={{ marginTop: Spacing.md }} 
          />

          <Button 
            title="Logout" 
            onPress={logout} 
            variant="ghost" 
            style={{ marginTop: Spacing.md, marginBottom: Spacing.xl }} 
          />

          <Modal visible={requestModalVisible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
                <Text style={[styles.modalTitle, { color: themeColors.text }]}>Request Profile Change</Text>
                <Text style={[styles.label, { color: themeColors.text }]}>First Name (optional)</Text>
                <TextInput
                  style={[styles.input, { color: themeColors.text, borderColor: themeColors.border }]}
                  placeholderTextColor={themeColors.textMuted}
                  placeholder="First Name"
                  value={requestFirstName}
                  onChangeText={setRequestFirstName}
                />

                <Text style={[styles.label, { color: themeColors.text }]}>Last Name (optional)</Text>
                <TextInput
                  style={[styles.input, { color: themeColors.text, borderColor: themeColors.border }]}
                  placeholderTextColor={themeColors.textMuted}
                  placeholder="Last Name"
                  value={requestLastName}
                  onChangeText={setRequestLastName}
                />

                <Text style={[styles.label, { color: themeColors.text }]}>Email (optional)</Text>
                <TextInput
                  style={[styles.input, { color: themeColors.text, borderColor: themeColors.border }]}
                  placeholderTextColor={themeColors.textMuted}
                  placeholder="staff@example.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={requestEmail}
                  onChangeText={setRequestEmail}
                />

                <Text style={[styles.label, { color: themeColors.text }]}>Phone Number (optional)</Text>
                <TextInput
                  style={[styles.input, { color: themeColors.text, borderColor: themeColors.border }]}
                  placeholderTextColor={themeColors.textMuted}
                  placeholder="+1234567890"
                  value={requestPhone}
                  onChangeText={setRequestPhone}
                />
                
                <Text style={[styles.label, { color: themeColors.text }]}>Campus (optional)</Text>
                <TouchableOpacity 
                  style={[styles.input, { borderColor: themeColors.border, paddingVertical: 12 }]} 
                  onPress={() => setCampusModalVisible(true)}
                >
                  <Text style={{ color: requestCampusId ? themeColors.text : themeColors.textMuted }}>
                    {requestCampusId ? campusesList.find(c => c.id === requestCampusId)?.name : 'Select Campus'}
                  </Text>
                </TouchableOpacity>
                
                <Text style={[styles.label, { color: themeColors.text }]}>Reason *</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { color: themeColors.text, borderColor: themeColors.border }]}
                  placeholderTextColor={themeColors.textMuted}
                  placeholder="Explain what needs to be changed and why..."
                  value={requestReason}
                  onChangeText={setRequestReason}
                  multiline
                  numberOfLines={4}
                />

                <View style={styles.modalActions}>
                  <Button 
                    title="Cancel" 
                    onPress={() => setRequestModalVisible(false)} 
                    variant="outline" 
                    style={styles.modalButton} 
                    disabled={isSendingRequest}
                  />
                  <Button 
                    title="Send Request" 
                    onPress={handleSendRequest} 
                    style={styles.modalButton} 
                    loading={isSendingRequest}
                  />
                </View>
              </View>
            </View>
          </Modal>

          <Modal visible={campusModalVisible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
                <Text style={[styles.modalTitle, { color: themeColors.text }]}>Select Campus</Text>
                <ScrollView style={{ maxHeight: 300 }}>
                  <TouchableOpacity style={styles.optionItem} onPress={() => { setRequestCampusId(null); setCampusModalVisible(false); }}>
                    <Text style={{ color: themeColors.text }}>None</Text>
                  </TouchableOpacity>
                  {campusesList.map(c => (
                    <TouchableOpacity key={c.id} style={styles.optionItem} onPress={() => { setRequestCampusId(c.id); setCampusModalVisible(false); }}>
                      <Text style={{ color: themeColors.text }}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Button title="Close" onPress={() => setCampusModalVisible(false)} variant="outline" style={{ marginTop: Spacing.md }} />
              </View>
            </View>
          </Modal>

          <Modal visible={passwordModalVisible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
                <Text style={[styles.modalTitle, { color: themeColors.text }]}>Change Password</Text>
                
                <Text style={[styles.label, { color: themeColors.text }]}>Current Password *</Text>
                <TextInput
                  style={[styles.input, { color: themeColors.text, borderColor: themeColors.border }]}
                  placeholderTextColor={themeColors.textMuted}
                  placeholder="Enter current password"
                  secureTextEntry
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />
                
                <Text style={[styles.label, { color: themeColors.text }]}>New Password *</Text>
                <TextInput
                  style={[styles.input, { color: themeColors.text, borderColor: themeColors.border }]}
                  placeholderTextColor={themeColors.textMuted}
                  placeholder="Enter new password"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />

                <Text style={[styles.label, { color: themeColors.text }]}>Confirm New Password *</Text>
                <TextInput
                  style={[styles.input, { color: themeColors.text, borderColor: themeColors.border }]}
                  placeholderTextColor={themeColors.textMuted}
                  placeholder="Confirm new password"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />

                <View style={styles.modalActions}>
                  <Button 
                    title="Cancel" 
                    onPress={() => setPasswordModalVisible(false)} 
                    variant="outline" 
                    style={styles.modalButton} 
                    disabled={isChangingPassword}
                  />
                  <Button 
                    title={isChangingPassword ? "Saving..." : "Change"} 
                    onPress={handleChangePassword} 
                    style={styles.modalButton} 
                    disabled={isChangingPassword}
                  />
                </View>
              </View>
            </View>
          </Modal>
        </>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    marginTop: 100,
  },
  errorText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.md,
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: Spacing.md,
    right: 0,
    backgroundColor: Colors.light.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.background,
  },
  name: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.xl,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
  },
  fieldsContainer: {
    gap: Spacing.sm,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fieldLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
  },
  fieldValue: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    padding: Spacing.xl,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
  },
  modalTitle: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.lg,
    marginBottom: Spacing.lg,
  },
  label: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontFamily: Typography.fontFamily,
    marginBottom: Spacing.md,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  modalButton: {
    flex: 1,
  },
  optionItem: {
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  }
});
