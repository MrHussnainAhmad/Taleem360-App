import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, useColorScheme, ScrollView, TextInput, RefreshControl, TouchableOpacity, Alert, Image, Modal } from 'react-native';
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

type StudentProfile = {
  id: number;
  name: string;
  fatherName: string | null;
  phone: string | null;
  gender: string;
  loginRollNumber: string;
  classRollNumber: string;
  className: string | null;
  sectionName: string | null;
  campusName: string | null;
  profilePictureUrl: string | null;
  emergencyContact: string | null;
  parentalWhatsapp: string | null;
  age: number | null;
};

type Option = {
  id: number;
  name: string;
  classId?: number;
};

export default function ProfileScreen() {
  const isDark = useColorScheme() === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;
  const { logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({ fatherName: '', phone: '', emergencyContact: '', parentalWhatsapp: '', age: '' });
  const [refreshing, setRefreshing] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  const [requestFatherName, setRequestFatherName] = useState('');
  const [requestFirstName, setRequestFirstName] = useState('');
  const [requestLastName, setRequestLastName] = useState('');
  const [requestClassId, setRequestClassId] = useState<number | null>(null);
  const [requestSectionId, setRequestSectionId] = useState<number | null>(null);
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  const [classesList, setClassesList] = useState<Option[]>([]);
  const [sectionsList, setSectionsList] = useState<Option[]>([]);
  
  const [classModalVisible, setClassModalVisible] = useState(false);
  const [sectionModalVisible, setSectionModalVisible] = useState(false);

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
      const data = await apiClient('/api/student/profile');
      setProfile(data.profile);
      setClassesList(data.classes || []);
      setSectionsList(data.sections || []);
      setEditForm({
        fatherName: data.profile.fatherName || '',
        phone: data.profile.phone || '',
        emergencyContact: data.profile.emergencyContact || '',
        parentalWhatsapp: data.profile.parentalWhatsapp || '',
        age: data.profile.age?.toString() || ''
      });
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiClient('/api/student/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          fatherName: editForm.fatherName,
          phone: editForm.phone,
          emergencyContact: editForm.emergencyContact,
          parentalWhatsapp: editForm.parentalWhatsapp,
          age: editForm.age ? parseInt(editForm.age, 10) : undefined
        }),
      });
      setProfile((prev) => prev ? { ...prev, ...editForm } : null);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
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
        await apiClient('/api/student/profile', {
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
      await apiClient('/api/student/profile-requests', {
        method: 'POST',
        body: JSON.stringify({
          firstName: requestFirstName || undefined,
          lastName: requestLastName || undefined,
          fatherName: requestFatherName || undefined,
          classId: requestClassId || undefined,
          sectionId: requestSectionId || undefined,
          reason: requestReason,
        }),
      });
      Alert.alert('Success', 'Profile change request sent to admin.');
      setRequestModalVisible(false);
      setRequestReason('');
      setRequestFirstName('');
      setRequestLastName('');
      setRequestFatherName('');
      setRequestClassId(null);
      setRequestSectionId(null);
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

  const renderField = (label: string, value: string | null | undefined, fieldKey?: keyof typeof editForm) => (
    <View style={[styles.fieldRow, { borderBottomColor: themeColors.border }]}>
      <Text style={[styles.fieldLabel, { color: themeColors.textMuted }]}>{label}</Text>
      {isEditing && fieldKey ? (
        <TextInput
          style={[styles.inlineInput, { color: themeColors.text, borderColor: themeColors.border }]}
          value={editForm[fieldKey]}
          onChangeText={(text) => setEditForm(prev => ({ ...prev, [fieldKey]: text }))}
        />
      ) : (
        <Text style={[styles.fieldValue, { color: themeColors.text }]}>{value || '-'}</Text>
      )}
    </View>
  );

  return (
    <ScreenShell
      title="Profile"
      subtitle="Personal and academic information."
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
                  <Ionicons name="person" color={themeColors.text} size={40} />
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
              {profile.className} - {profile.sectionName}
            </Text>
          </View>

          <Card title="Personal Information">
            <View style={styles.fieldsContainer}>
              {renderField("Father's Name", profile.fatherName, "fatherName")}
              {renderField("Gender", profile.gender)}
              {renderField("Age", profile.age?.toString(), "age")}
            </View>
          </Card>

          <Card title="Contact Information" style={{ marginTop: Spacing.md }}>
            <View style={styles.fieldsContainer}>
              {renderField("Phone", profile.phone, "phone")}
              {renderField("Emergency Contact", profile.emergencyContact, "emergencyContact")}
              {renderField("Parental WhatsApp", profile.parentalWhatsapp, "parentalWhatsapp")}
            </View>
            {isEditing ? (
              <View style={styles.actionRow}>
                <Button title="Cancel" variant="outline" onPress={() => setIsEditing(false)} style={{ flex: 1, marginRight: Spacing.sm }} />
                <Button title={isSaving ? "Saving..." : "Save"} variant="solid" onPress={handleSave} disabled={isSaving} style={{ flex: 1 }} />
              </View>
            ) : (
              <Button title="Edit Profile" variant="outline" onPress={() => setIsEditing(true)} style={{ marginTop: Spacing.md }} />
            )}
          </Card>

          <Card title="Academic Information" style={{ marginTop: Spacing.md }}>
            <View style={styles.fieldsContainer}>
              {renderField("Login ID", profile.loginRollNumber)}
              {renderField("Class Roll No.", profile.classRollNumber)}
              {renderField("Campus", profile.campusName)}
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

                <Text style={[styles.label, { color: themeColors.text }]}>Father Name (optional)</Text>
                <TextInput
                  style={[styles.input, { color: themeColors.text, borderColor: themeColors.border }]}
                  placeholderTextColor={themeColors.textMuted}
                  placeholder="Father's Full Name"
                  value={requestFatherName}
                  onChangeText={setRequestFatherName}
                />
                
                <Text style={[styles.label, { color: themeColors.text }]}>Class (optional)</Text>
                <TouchableOpacity 
                  style={[styles.input, { borderColor: themeColors.border, paddingVertical: 12 }]} 
                  onPress={() => setClassModalVisible(true)}
                >
                  <Text style={{ color: requestClassId ? themeColors.text : themeColors.textMuted }}>
                    {requestClassId ? classesList.find(c => c.id === requestClassId)?.name : 'Select Class'}
                  </Text>
                </TouchableOpacity>

                <Text style={[styles.label, { color: themeColors.text }]}>Section (optional)</Text>
                <TouchableOpacity 
                  style={[styles.input, { borderColor: themeColors.border, paddingVertical: 12 }]} 
                  onPress={() => setSectionModalVisible(true)}
                >
                  <Text style={{ color: requestSectionId ? themeColors.text : themeColors.textMuted }}>
                    {requestSectionId ? sectionsList.find(s => s.id === requestSectionId)?.name : 'Select Section'}
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
                    title={isSendingRequest ? "Sending..." : "Send Request"} 
                    onPress={handleSendRequest} 
                    style={styles.modalButton} 
                    disabled={isSendingRequest}
                  />
                </View>
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

          <Modal visible={classModalVisible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
                <Text style={[styles.modalTitle, { color: themeColors.text }]}>Select Class</Text>
                <ScrollView style={{ maxHeight: 300 }}>
                  <TouchableOpacity style={styles.optionItem} onPress={() => { setRequestClassId(null); setClassModalVisible(false); }}>
                    <Text style={{ color: themeColors.text }}>None</Text>
                  </TouchableOpacity>
                  {classesList.map(c => (
                    <TouchableOpacity key={c.id} style={styles.optionItem} onPress={() => { setRequestClassId(c.id); setClassModalVisible(false); }}>
                      <Text style={{ color: themeColors.text }}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Button title="Close" onPress={() => setClassModalVisible(false)} variant="outline" style={{ marginTop: Spacing.md }} />
              </View>
            </View>
          </Modal>

          <Modal visible={sectionModalVisible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
                <Text style={[styles.modalTitle, { color: themeColors.text }]}>Select Section</Text>
                <ScrollView style={{ maxHeight: 300 }}>
                  <TouchableOpacity style={styles.optionItem} onPress={() => { setRequestSectionId(null); setSectionModalVisible(false); }}>
                    <Text style={{ color: themeColors.text }}>None</Text>
                  </TouchableOpacity>
                  {sectionsList
                    .filter(s => !requestClassId || s.classId === requestClassId)
                    .map(s => (
                    <TouchableOpacity key={s.id} style={styles.optionItem} onPress={() => { setRequestSectionId(s.id); setSectionModalVisible(false); }}>
                      <Text style={{ color: themeColors.text }}>{s.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Button title="Close" onPress={() => setSectionModalVisible(false)} variant="outline" style={{ marginTop: Spacing.md }} />
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
  input: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  inlineInput: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    minWidth: 150,
    textAlign: 'right',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
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
