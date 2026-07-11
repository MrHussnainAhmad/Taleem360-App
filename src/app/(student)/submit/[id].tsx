import { useThemeColors } from '@/context/ThemePreferencesContext';
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { apiClient } from '@/utils/api';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ScreenShell } from '@/components/ui/ScreenShell';

export default function SubmitAssignmentScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const themeColors = useThemeColors();

  const [file, setFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.replace('/(student)/submissions');
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [router])
  );

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setFile(result);
        setError('');
      }
    } catch (err) {
      console.error('Document picker error:', err);
    }
  };

  const handleSubmit = async () => {
    if (!file || file.canceled) {
      setError('Please select a file to upload first.');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    setError('');

    try {
      // 1. Get Cloudinary signature
      const sigRes = await apiClient('/api/upload/signature', { method: 'POST' });
      const { signature, timestamp, cloudName, apiKey } = sigRes;

      if (!cloudName || !apiKey) {
        throw new Error('Cloudinary config missing on server');
      }

      // 2. Upload file to Cloudinary
      const formData = new FormData();
      formData.append('file', {
        uri: file.assets[0].uri,
        name: file.assets[0].name,
        type: file.assets[0].mimeType || 'application/octet-stream',
      } as any);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      formData.append('folder', 'lms-uploads');

      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
      
      const uploadData = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', uploadUrl);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(e.loaded / e.total);
          }
        };
        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 201) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              reject(new Error(err.error?.message || 'Failed to upload file'));
            } catch {
              reject(new Error('Failed to upload file to Cloudinary'));
            }
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(formData);
      });

      const fileKey = uploadData.public_id; // This will be something like "lms-uploads/..."

      // 3. Submit assignment
      await apiClient('/api/student/submissions', {
        method: 'POST',
        body: JSON.stringify({
          assignmentId: Number(id),
          fileKey: fileKey
        })
      });

      Alert.alert(
        "Submission Done",
        "Your assignment has been submitted successfully.",
        [
          { text: "OK", onPress: () => router.replace('/(student)/submissions') }
        ]
      );
    } catch (err: any) {
      setError(err.message || 'Failed to submit assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenShell
      title="Submit Assignment"
      subtitle={`Assignment #${id}`}
      eyebrow="Upload"
      icon={<Ionicons name="cloud-upload-outline" size={22} color="#FFFFFF" />}
      scrollable={false}
      sheetStyle={styles.shellSheet}
    >
      <Card title={`Assignment #${id}`}>
        <View style={styles.uploadArea}>
          {file && !file.canceled ? (
            <View style={styles.fileInfo}>
              <Text style={[styles.fileName, { color: themeColors.text }]}>{file.assets[0].name}</Text>
              <Text style={[styles.fileSize, { color: themeColors.textMuted }]}>
                {(file.assets[0].size ?? 0 / 1024).toFixed(2)} KB
              </Text>
            </View>
          ) : (
            <Text style={{ color: themeColors.textMuted, marginBottom: Spacing.md }}>
              No file selected.
            </Text>
          )}

          <Button 
            title={file && !file.canceled ? "Change File" : "Select File"} 
            variant="outline" 
            onPress={handlePickDocument} 
          />
        </View>

        {error ? (
          <Text style={[styles.errorText, { color: themeColors.error }]}>{error}</Text>
        ) : null}

        <Button 
          title={isSubmitting ? "Submitting..." : "Submit"} 
          variant="solid" 
          onPress={handleSubmit} 
          disabled={isSubmitting || !file}
          style={{ marginTop: Spacing.lg }}
        />

        {isSubmitting && uploadProgress > 0 && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBarBg, { backgroundColor: themeColors.border }]}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { backgroundColor: themeColors.accent, width: `${Math.round(uploadProgress * 100)}%` }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: themeColors.textMuted }]}>
              Uploading... {Math.round(uploadProgress * 100)}%
            </Text>
          </View>
        )}
      </Card>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  shellSheet: {
    padding: Spacing.md,
  },
  title: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.xl,
    marginBottom: Spacing.lg,
  },
  uploadArea: {
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  fileInfo: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  fileName: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.md,
    marginBottom: 4,
    textAlign: 'center',
  },
  fileSize: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
  },
  errorText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    marginTop: Spacing.md,
  },
  progressContainer: {
    marginTop: Spacing.md,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressBarFill: {
    height: '100%',
  },
  progressText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.xs,
    textAlign: 'center',
  }
});
