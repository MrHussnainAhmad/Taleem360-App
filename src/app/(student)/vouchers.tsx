import React, { useEffect, useState } from 'react';
import { Alert, Image, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/context/ThemePreferencesContext';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { SkeletonPage } from '@/components/ui/Skeleton';
import { apiClient } from '@/utils/api';
import { uploadImageToCloudinary } from '@/utils/upload';

type Voucher = { id: number; title: string; imageUrl: string; createdAt: string };

export default function VouchersScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const [available, setAvailable] = useState<boolean | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [title, setTitle] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    try {
      // Direct content fetch — no nav-availability probe. 403 means feature off.
      const result = await apiClient('/api/student/vouchers');
      setAvailable(true);
      setVouchers(result.vouchers || []);
    } catch (error: any) {
      const message = error?.message || '';
      if (typeof message === 'string' && message.toLowerCase().includes('not enabled')) {
        setAvailable(false);
        setVouchers([]);
      } else {
        Alert.alert('Could not load vouchers', message || 'Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading && !refreshing) {
    return <SkeletonPage title="Fee & Vouchers" subtitle="Loading your fee vouchers." eyebrow="Finance" iconName="receipt-outline" variant="form" />;
  }

  const chooseImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo permission required', 'Allow access to your photos to upload a fee voucher.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const uploadVoucher = async () => {
    if (!title.trim() || !imageUri) {
      Alert.alert('Complete the form', 'Enter a voucher title and select its image.');
      return;
    }
    setUploading(true);
    try {
      const imageUrl = await uploadImageToCloudinary(imageUri, 'vouchers');
      await apiClient('/api/student/vouchers', { method: 'POST', body: JSON.stringify({ title: title.trim(), imageUrl }) });
      setTitle('');
      setImageUri(null);
      Alert.alert('Voucher uploaded', 'Your fee voucher has been submitted.');
      await load();
    } catch (error: any) {
      Alert.alert('Upload failed', error.message || 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScreenShell title="Fee & Vouchers" subtitle="Upload and view your fee payment vouchers." eyebrow="Finance" icon={<Ionicons name="receipt-outline" size={22} color="#FFFFFF" />} actions={<TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" size={20} color="#FFFFFF" /></TouchableOpacity>} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
      {available === false ? (
        <Card><View style={styles.empty}><Ionicons name="lock-closed-outline" size={36} color={themeColors.textMuted} /><Text style={[styles.emptyTitle, { color: themeColors.text }]}>Fee vouchers are unavailable</Text><Text style={[styles.emptyText, { color: themeColors.textMuted }]}>Your institution has not enabled Fee & Finance Features.</Text></View></Card>
      ) : <>
        <Card title="Upload a Voucher">
          <Text style={[styles.label, { color: themeColors.text }]}>Voucher title / month</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="E.g., October 2026 Fee" placeholderTextColor={themeColors.textMuted} style={[styles.input, { color: themeColors.text, borderColor: themeColors.border, backgroundColor: themeColors.background }]} />
          <TouchableOpacity onPress={chooseImage} style={[styles.imagePicker, { borderColor: themeColors.border, backgroundColor: themeColors.background }]}>
            {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} /> : <><Ionicons name="image-outline" size={30} color={themeColors.accent} /><Text style={[styles.imagePickerText, { color: themeColors.text }]}>Choose voucher image</Text><Text style={[styles.imagePickerHint, { color: themeColors.textMuted }]}>JPEG or PNG</Text></>}
          </TouchableOpacity>
          {imageUri ? <Button title="Choose another image" variant="outline" onPress={chooseImage} style={styles.replaceButton} /> : null}
          <Button title={uploading ? 'Uploading...' : 'Submit Voucher'} onPress={uploadVoucher} loading={uploading} disabled={uploading} icon={!uploading ? <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" /> : undefined} />
        </Card>
        <Card title="Your Uploaded Vouchers">
          {vouchers.length === 0 ? <View style={styles.empty}><Ionicons name="receipt-outline" size={36} color={themeColors.textMuted} /><Text style={[styles.emptyText, { color: themeColors.textMuted }]}>You have not uploaded any fee vouchers yet.</Text></View> : vouchers.map((voucher, index) => <View key={voucher.id} style={[styles.voucher, index > 0 && { borderTopColor: themeColors.border, borderTopWidth: StyleSheet.hairlineWidth }]}><Image source={{ uri: voucher.imageUrl }} style={styles.thumbnail} /><View style={styles.voucherInfo}><Text style={[styles.voucherTitle, { color: themeColors.text }]} numberOfLines={1}>{voucher.title}</Text><Text style={[styles.voucherDate, { color: themeColors.textMuted }]}>Uploaded {new Date(voucher.createdAt).toLocaleDateString()}</Text></View></View>)}
        </Card>
      </>}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  label: { fontFamily: Typography.fontFamilyMedium, fontSize: Typography.size.sm, marginBottom: Spacing.xs },
  input: { minHeight: 46, borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.md, fontFamily: Typography.fontFamily, fontSize: Typography.size.md, marginBottom: Spacing.md },
  imagePicker: { minHeight: 150, borderWidth: 1, borderStyle: 'dashed', borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: Spacing.md },
  preview: { width: '100%', height: 180, resizeMode: 'contain' },
  imagePickerText: { fontFamily: Typography.fontFamilyMedium, fontSize: Typography.size.sm, marginTop: Spacing.sm },
  imagePickerHint: { fontFamily: Typography.fontFamily, fontSize: Typography.size.xs, marginTop: 2 },
  replaceButton: { marginTop: Spacing.sm, marginBottom: Spacing.sm },
  empty: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  emptyTitle: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.md, textAlign: 'center' },
  emptyText: { fontFamily: Typography.fontFamily, fontSize: Typography.size.sm, textAlign: 'center' },
  voucher: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  thumbnail: { width: 64, height: 64, borderRadius: Radius.sm, backgroundColor: '#E2E8F0' },
  voucherInfo: { flex: 1 },
  voucherTitle: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.md },
  voucherDate: { fontFamily: Typography.fontFamily, fontSize: Typography.size.xs, marginTop: 4 },
});
