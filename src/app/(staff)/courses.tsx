import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Upload } from 'tus-js-client';
import { apiClient, BASE_URL } from '@/utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { getAccessToken } from '@/utils/auth-storage';
import { useProcessingActivity } from '@/hooks/use-processing-activity';
import { pollVideoProcessing } from '@/utils/processing-poll';
import { useThemeColors } from '@/context/ThemePreferencesContext';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SkeletonList } from '@/components/ui/Skeleton';

type Option = { id: number; name: string };
type Assignment = { classId: number; subjectId: number };
type Course = { id: number; title: string; lectureCount: number; subjectName: string };
type Lecture = { id: number; sequence: number; title: string; description: string | null; videoUrl: string };
type Pagination = { page: number; pageSize: number; total: number; pages: number };
type VideoDraft = { uploadId: string; courseId: number; sequence: string; title: string; description: string };
async function videoDraftKey() {
  const token = await getAccessToken();
  if (!token) throw new Error('Please sign in again.');
  const claims = jwtDecode<{ userId?: number; sub?: string; institutionId?: number; role?: string }>(token);
  const id = claims.userId ?? claims.sub;
  if (!id) throw new Error('Please sign in again.');
  return 'course-video:' + BASE_URL + ':' + claims.role + ':' + claims.institutionId + ':' + id;
}
const emptyPagination = { page: 1, pageSize: 10, total: 0, pages: 1 };

export default function StaffCoursesScreen() {
  const colors = useThemeColors();
  const [courses, setCourses] = useState<Course[]>([]), [classes, setClasses] = useState<Option[]>([]), [subjects, setSubjects] = useState<Option[]>([]), [assignments, setAssignments] = useState<Assignment[]>([]), [pagination, setPagination] = useState<Pagination>(emptyPagination), [page, setPage] = useState(1), [loading, setLoading] = useState(true), [refreshing, setRefreshing] = useState(false), [busy, setBusy] = useState(false), [showCreate, setShowCreate] = useState(false), [detail, setDetail] = useState<{ course: Course; lectures: Lecture[] } | null>(null), [loadingDetail, setLoadingDetail] = useState(false);
  const [title, setTitle] = useState(''), [subjectId, setSubjectId] = useState<number | null>(null), [classIds, setClassIds] = useState<number[]>([]), [lectureCount, setLectureCount] = useState('');
  const [sequence, setSequence] = useState(''), [lectureTitle, setLectureTitle] = useState(''), [description, setDescription] = useState(''), [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null), [uploadProgress, setUploadProgress] = useState('');
  const metadataLoaded = useRef(false);
  const activity = useProcessingActivity();
  const [pendingVideo, setPendingVideo] = useState<VideoDraft | null>(null);
  useEffect(() => {
    let active = true;
    void videoDraftKey().then(key => AsyncStorage.getItem(key)).then(async stored => {
      if (!stored || !active) return;
      const draft: VideoDraft = JSON.parse(stored);
      if (!draft.uploadId || !Number.isInteger(draft.courseId)) return;
      const saved = await apiClient('/api/staff/courses/' + draft.courseId);
      if (!active) return;
      setPendingVideo(draft); setDetail(saved); setSequence(draft.sequence);
      setLectureTitle(draft.title); setDescription(draft.description);
      setUploadProgress('Your uploaded video is saved. Resume processing to finish the lecture.');
    }).catch(() => { /* A missing draft must not block course browsing. */ });
    return () => { active = false; };
  }, []);
  const allowedClasses = useMemo(() => classes.filter((item) => assignments.some((assignment) => assignment.classId === item.id && assignment.subjectId === subjectId)), [assignments, classes, subjectId]);

  const load = useCallback(async (pageNumber: number, forceMeta = false) => { try { const data = await apiClient(`/api/staff/courses?page=${pageNumber}${!metadataLoaded.current || forceMeta ? '&meta=1' : ''}`); setCourses(data.courses || []); setPagination(data.pagination || emptyPagination); if (data.options) { setClasses(data.options.classes || []); setSubjects(data.options.subjects || []); setAssignments(data.options.assignments || []); metadataLoaded.current = true; } } catch (err: unknown) { Alert.alert('Courses unavailable', err instanceof Error ? err.message : 'Please try again.'); } finally { setLoading(false); setRefreshing(false); } }, []);
  useEffect(() => { void load(page); }, [load, page]);
  async function create() { if (!title.trim() || !subjectId || !classIds.length || !Number.isInteger(Number(lectureCount))) return; setBusy(true); try { await apiClient('/api/staff/courses', { method: 'POST', body: JSON.stringify({ title: title.trim(), subjectId, classIds, lectureCount: Number(lectureCount) }) }); setShowCreate(false); setTitle(''); setSubjectId(null); setClassIds([]); setLectureCount(''); if (page === 1) await load(1); else setPage(1); Alert.alert('Course created', 'Open it to add lectures.'); } catch (err: unknown) { Alert.alert('Could not create course', err instanceof Error ? err.message : 'Please try again.'); } finally { setBusy(false); } }
  async function openCourse(id: number) { if (pendingVideo && pendingVideo.courseId !== id) { Alert.alert('Finish uploaded lecture', 'Resume the saved video in its course before opening another course.'); return; } setLoadingDetail(true); setDetail(null); try { setDetail(await apiClient(`/api/staff/courses/${id}`)); } catch (err: unknown) { Alert.alert('Could not open course', err instanceof Error ? err.message : 'Please try again.'); } finally { setLoadingDetail(false); } }
  async function pickVideo() { if (pendingVideo) return; const result = await DocumentPicker.getDocumentAsync({ type: 'video/*', copyToCacheDirectory: false, multiple: false }); if (!result.canceled) setVideoFile(result.assets[0]); }
  async function uploadVideo(file: DocumentPicker.DocumentPickerAsset) {
    if (file.size && file.size > 5 * 1024 * 1024 * 1024) throw new Error('Video files cannot exceed 5 GB');
    const signal = activity.getSignal();
    await activity.waitUntilActive(signal);
    const draftKey = await videoDraftKey();
    setUploadProgress('Preparing protected upload…');
    const upload = await apiClient('/api/staff/courses/uploads', { method: 'POST', body: JSON.stringify({ title: lectureTitle.trim(), contentType: file.mimeType || 'video/mp4' }) });
    if (upload.uploadMethod === 'TUS') {
      await new Promise<void>((resolve, reject) => {
        const task = new Upload({ uri: file.uri } as unknown as Blob, { endpoint: upload.uploadUrl, headers: upload.headers, metadata: { filename: file.name, filetype: file.mimeType || 'video/mp4', title: lectureTitle.trim() }, retryDelays: [0, 1500, 4000, 8000], onProgress: (sent, total) => setUploadProgress(`Uploading… ${Math.round((sent / total) * 100)}%`), onError: reject, onSuccess: () => resolve() });
        task.start();
      });
    } else {
      setUploadProgress('Uploading video…');
      const response = await FileSystem.uploadAsync(upload.uploadUrl, file.uri, {
        httpMethod: 'PUT',
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: upload.headers,
      });
      if (response.status < 200 || response.status >= 300) throw new Error('The streaming provider rejected the video upload');
    }
    const draft: VideoDraft = { uploadId: upload.uploadId, courseId: detail!.course.id, sequence, title: lectureTitle.trim(), description: description.trim() };
    // Persist before polling; resuming never uploads the same file again.
    await AsyncStorage.setItem(draftKey, JSON.stringify(draft));
    if (!signal.aborted) setPendingVideo(draft);
    return processVideo(draft, signal);
  }
  async function processVideo(draft: VideoDraft, signal: AbortSignal) {
    if (signal.aborted) throw new Error('Processing cancelled');
    setUploadProgress('Processing adaptive video quality…');
    return pollVideoProcessing(
      requestSignal => apiClient('/api/staff/courses/uploads?uploadId=' + encodeURIComponent(draft.uploadId), { signal: requestSignal }),
      { signal, waitUntilActive: () => activity.waitUntilActive(signal) },
    );
  }
  async function saveLecture() {
    if (!detail || !Number.isInteger(Number(sequence)) || !lectureTitle.trim() || (!videoUrl.trim() && !videoFile && !pendingVideo)) return;
    const signal = activity.getSignal();
    const courseId = detail.course.id;
    setBusy(true);
    try {
      const draftKey = await videoDraftKey();
      const resolvedVideoUrl = pendingVideo ? await processVideo(pendingVideo, signal) : videoFile ? await uploadVideo(videoFile) : videoUrl.trim();
      if (signal.aborted) return;
      await activity.waitUntilActive(signal);
      const draft = pendingVideo;
      await apiClient('/api/staff/courses/' + (draft?.courseId ?? courseId), { method: 'POST', body: JSON.stringify({ sequence: Number(draft?.sequence ?? sequence), title: draft?.title ?? lectureTitle.trim(), description: (draft?.description ?? description.trim()) || null, videoUrl: resolvedVideoUrl }), signal });
      await AsyncStorage.removeItem(draftKey);
      if (signal.aborted) return;
      setPendingVideo(null); setSequence(''); setLectureTitle(''); setDescription(''); setVideoUrl(''); setVideoFile(null); setUploadProgress('');
      await openCourse(draft?.courseId ?? courseId);
      Alert.alert('Lecture saved', 'Students will see lectures in ascending order.');
    } catch (err: unknown) {
      if (!signal.aborted) Alert.alert('Could not save lecture', err instanceof Error ? err.message : 'Check the video and try again.');
    } finally {
      if (!signal.aborted) { setBusy(false); setUploadProgress(''); }
    }
  }

  return <><ScreenShell title="Courses" subtitle="Create video courses for your assigned classes." eyebrow="Teaching" icon={<Ionicons name="play-circle-outline" size={22} color="#FFF" />} actions={<TouchableOpacity style={styles.add} onPress={() => setShowCreate(true)}><Ionicons name="add" size={23} color="#FFF" /></TouchableOpacity>} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(page, true); }} />}>
    {pendingVideo ? <Card><Text style={{ color: colors.text }}>An uploaded video is waiting to finish its lecture.</Text><Button title="Resume saved lecture" variant="outline" disabled={busy} onPress={() => { setSequence(pendingVideo.sequence); setLectureTitle(pendingVideo.title); setDescription(pendingVideo.description); void openCourse(pendingVideo.courseId); }} /><Button title="Discard saved draft" variant="ghost" disabled={busy} onPress={() => Alert.alert('Discard saved draft?', 'This clears the local lecture draft. The uploaded video remains with the streaming provider.', [{ text: 'Keep draft', style: 'cancel' }, { text: 'Discard', style: 'destructive', onPress: () => { void videoDraftKey().then(key => AsyncStorage.removeItem(key)).then(() => { setPendingVideo(null); setUploadProgress(''); }).catch(() => Alert.alert('Could not discard draft', 'Please try again.')); } }])} /></Card> : null}
    {loading && !refreshing ? <SkeletonList rows={4} /> : courses.length === 0 ? <Card><Text style={[styles.empty, { color: colors.textMuted }]}>No courses created yet.</Text></Card> : courses.map((course) => <TouchableOpacity key={course.id} activeOpacity={0.78} onPress={() => void openCourse(course.id)}><Card><View style={styles.courseRow}><View style={[styles.icon, { backgroundColor: colors.primaryBg }]}><Ionicons name="film-outline" size={22} color={colors.accent} /></View><View style={{ flex: 1 }}><Text style={[styles.courseTitle, { color: colors.text }]}>{course.title}</Text><Text style={[styles.meta, { color: colors.textMuted }]}>{course.subjectName} · {course.lectureCount} lecture slots</Text></View><Ionicons name="chevron-forward" size={20} color={colors.textMuted} /></View></Card></TouchableOpacity>)}
    {pagination.pages > 1 ? <View style={styles.pagination}><Button title="Previous" variant="outline" disabled={page <= 1} onPress={() => { setLoading(true); setPage((value) => value - 1); }} /><Text style={{ color: colors.textMuted }}>Page {pagination.page} of {pagination.pages}</Text><Button title="Next" variant="outline" disabled={page >= pagination.pages} onPress={() => { setLoading(true); setPage((value) => value + 1); }} /></View> : null}
  </ScreenShell>
  <Modal visible={showCreate} onClose={() => !busy && setShowCreate(false)} title="Create course" footer={<><Button title="Cancel" variant="ghost" disabled={busy} onPress={() => setShowCreate(false)} /><Button title="Create" loading={busy} disabled={!title.trim() || !subjectId || !classIds.length || !lectureCount} onPress={() => void create()} /></>}><TextInput value={title} onChangeText={setTitle} placeholder="Course name" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.text, borderColor: colors.border }]} /><Text style={[styles.label, { color: colors.text }]}>Subject</Text><View style={styles.options}>{subjects.map((item) => <OptionButton key={item.id} label={item.name} selected={subjectId === item.id} onPress={() => { setSubjectId(item.id); setClassIds([]); }} />)}</View><Text style={[styles.label, { color: colors.text }]}>Classes</Text><View style={styles.options}>{allowedClasses.map((item) => <OptionButton key={item.id} label={item.name} selected={classIds.includes(item.id)} onPress={() => setClassIds((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} />)}</View><TextInput value={lectureCount} onChangeText={setLectureCount} keyboardType="number-pad" placeholder="Planned lectures" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.text, borderColor: colors.border }]} /></Modal>
  <Modal visible={loadingDetail || Boolean(detail)} onClose={() => !busy && !loadingDetail && setDetail(null)} title={detail?.course.title || 'Course lectures'} contentStyle={{ maxHeight: 620 }} footer={detail ? <><Button title="Close" variant="ghost" disabled={busy} onPress={() => setDetail(null)} /><Button title={pendingVideo ? 'Resume & save' : videoFile ? 'Upload & save' : 'Save lecture'} loading={busy} disabled={!sequence || !lectureTitle.trim() || (!videoUrl.trim() && !videoFile && !pendingVideo)} onPress={() => void saveLecture()} /></> : undefined}>{loadingDetail || !detail ? <Text style={[styles.empty, { color: colors.textMuted }]}>Loading course…</Text> : <ScrollView keyboardShouldPersistTaps="handled"><View style={[styles.summary, { backgroundColor: colors.primaryBg }]}><Text style={[styles.summaryTitle, { color: colors.text }]}>{detail.lectures.length} of {detail.course.lectureCount}</Text><Text style={[styles.meta, { color: colors.textMuted }]}>lecture slots completed</Text></View><View style={[styles.plan, { borderColor: colors.border }]}>{Array.from({ length: detail.course.lectureCount }, (_, index) => index + 1).map((slot) => { const lecture = detail.lectures.find((item) => item.sequence === slot); return <View key={slot} style={styles.slot}><Ionicons name={lecture ? 'checkmark-circle' : 'ellipse-outline'} size={17} color={lecture ? colors.success : colors.textMuted} /><Text numberOfLines={1} style={[styles.slotText, { color: colors.text }]}>{slot}. {lecture?.title || 'Not added yet'}</Text></View>; })}</View><Text style={[styles.sectionTitle, { color: colors.text }]}>Add a lecture</Text><TextInput editable={!busy && !pendingVideo} value={sequence} onChangeText={setSequence} keyboardType="number-pad" placeholder="Lecture number" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.text, borderColor: colors.border }]} /><TextInput editable={!busy && !pendingVideo} value={lectureTitle} onChangeText={setLectureTitle} placeholder="Lecture title" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.text, borderColor: colors.border }]} /><TextInput editable={!busy && !pendingVideo} value={description} onChangeText={setDescription} multiline placeholder="Description (optional)" placeholderTextColor={colors.textMuted} style={[styles.input, styles.textarea, { color: colors.text, borderColor: colors.border }]} /><TouchableOpacity accessibilityRole="button" accessibilityLabel="Choose video from device" disabled={busy || Boolean(pendingVideo)} activeOpacity={0.8} onPress={() => void pickVideo()} style={[styles.filePicker, { borderColor: videoFile ? colors.accent : colors.border, backgroundColor: colors.surface }]}><Ionicons name={videoFile ? 'checkmark-circle' : 'cloud-upload-outline'} size={26} color={videoFile ? colors.success : colors.accent} /><View style={{ flex: 1 }}><Text style={[styles.fileTitle, { color: colors.text }]}>{videoFile?.name || 'Choose video from device'}</Text><Text style={[styles.meta, { color: colors.textMuted }]}>{videoFile ? 'Ready for protected direct upload' : 'Original quality uploads directly to the streaming provider.'}</Text></View></TouchableOpacity>{uploadProgress ? <Text style={[styles.progress, { color: colors.accent }]}>{uploadProgress}</Text> : null}<View style={styles.orRow}><View style={[styles.orLine, { backgroundColor: colors.border }]} /><Text style={[styles.orText, { color: colors.textMuted }]}>OR USE AN EXISTING VIDEO</Text><View style={[styles.orLine, { backgroundColor: colors.border }]} /></View><TextInput editable={!busy && !pendingVideo} value={videoUrl} onChangeText={setVideoUrl} autoCapitalize="none" keyboardType="url" placeholder="Bunny or Mux HTTPS video link" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.text, borderColor: colors.border }]} /></ScrollView>}</Modal></>;
}

function OptionButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) { const colors = useThemeColors(); return <TouchableOpacity onPress={onPress} style={[styles.option, { borderColor: selected ? colors.accent : colors.border, backgroundColor: selected ? colors.primaryBg : colors.surface }]}><Text style={{ color: colors.text }}>{label}</Text></TouchableOpacity>; }
const styles = StyleSheet.create({ add: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.16)' }, empty: { textAlign: 'center', paddingVertical: Spacing.lg, fontFamily: Typography.fontFamily }, courseRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md }, icon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' }, courseTitle: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.lg }, meta: { fontFamily: Typography.fontFamily, fontSize: Typography.size.sm, marginTop: 3 }, pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm }, input: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, fontFamily: Typography.fontFamily }, textarea: { minHeight: 80, textAlignVertical: 'top' }, label: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.sm, marginBottom: Spacing.sm }, options: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md }, option: { borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm }, summary: { borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md }, summaryTitle: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.size.xl }, sectionTitle: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.lg, marginBottom: Spacing.md }, plan: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.sm, marginBottom: Spacing.lg, maxHeight: 180 }, slot: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 5 }, slotText: { flex: 1, fontFamily: Typography.fontFamily, fontSize: Typography.size.sm }, filePicker: { minHeight: 82, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: Spacing.md }, fileTitle: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.md }, progress: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.sm, marginBottom: Spacing.md }, orRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginVertical: Spacing.md }, orLine: { height: 1, flex: 1 }, orText: { fontFamily: Typography.fontFamilySemiBold, fontSize: 10, letterSpacing: 0.7 } });
