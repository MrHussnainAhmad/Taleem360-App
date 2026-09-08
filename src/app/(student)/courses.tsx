import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEventListener } from "expo";
import { VideoView, useVideoPlayer } from "expo-video";
import { apiClient } from "@/utils/api";
import { useThemeColors } from "@/context/ThemePreferencesContext";
import { Radius, Spacing, Typography } from "@/constants/theme";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonPage } from "@/components/ui/Skeleton";

type Course = {
  courseId: number;
  title: string;
  subjectName: string;
  teacherName: string;
  lectureCount: number;
  completedCount: number;
};
type Lecture = {
  lectureId: number;
  sequence: number;
  lectureTitle: string;
  description: string | null;
  readAt: string | null;
};
type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  pages: number;
};

export default function CoursesScreen() {
  const colors = useThemeColors();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [playingLecture, setPlayingLecture] = useState<Lecture | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function load(pageNumber: number) {
    try {
      const data = await apiClient(`/api/student/courses?page=${pageNumber}`);
      setCourses(data.courses || []);
      setPagination(
        data.pagination || {
          page: pageNumber,
          pageSize: 10,
          total: 0,
          pages: 1,
        },
      );
    } catch (error: unknown) {
      Alert.alert(
        "Could not load courses",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load(page);
  }, [page]);

  async function openCourse(course: Course) {
    setSelectedCourse(course);
    setLectures([]);
    setLoadingDetail(true);
    try {
      const data = await apiClient(`/api/student/courses/${course.courseId}`);
      setLectures(data.lectures || []);
    } catch (error: unknown) {
      setSelectedCourse(null);
      Alert.alert(
        "Could not load lectures",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setLoadingDetail(false);
    }
  }

  async function watch(lecture: Lecture) {
    setPlayingLecture(lecture);
    setPlaybackUrl("");
    setLoadingVideo(true);
    try {
      const data = await apiClient(
        `/api/student/courses/lectures/${lecture.lectureId}/playback`,
      );
      if (!data.playbackUrl)
        throw new Error("Secure video playback is unavailable.");
      setPlaybackUrl(data.playbackUrl);
    } catch (error: unknown) {
      setPlayingLecture(null);
      Alert.alert(
        "Video unavailable",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setLoadingVideo(false);
    }
  }

  async function markWatched(lectureId: number) {
    const lecture = lectures.find((item) => item.lectureId === lectureId);
    if (!lecture || lecture.readAt) return;
    try {
      await apiClient("/api/student/courses", {
        method: "POST",
        body: JSON.stringify({ lectureId }),
      });
      setLectures((current) =>
        current.map((item) =>
          item.lectureId === lectureId
            ? { ...item, readAt: new Date().toISOString() }
            : item,
        ),
      );
      setCourses((current) =>
        current.map((course) =>
          course.courseId === selectedCourse?.courseId
            ? {
                ...course,
                completedCount: Math.min(
                  course.lectureCount,
                  course.completedCount + 1,
                ),
              }
            : course,
        ),
      );
      setSelectedCourse((current) =>
        current
          ? {
              ...current,
              completedCount: Math.min(
                current.lectureCount,
                current.completedCount + 1,
              ),
            }
          : current,
      );
    } catch (error: unknown) {
      Alert.alert(
        "Could not update progress",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  }

  if (loading && !refreshing)
    return (
      <SkeletonPage
        title="Courses"
        subtitle="Loading your courses."
        eyebrow="Learning"
        iconName="play-circle-outline"
        variant="list"
      />
    );

  return (
    <>
      <ScreenShell
        title="Courses"
        subtitle="Continue learning from your teachers."
        eyebrow="Learning"
        icon={<Ionicons name="play-circle-outline" size={22} color="#FFF" />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setPage(1);
              void load(1);
            }}
          />
        }
      >
        {courses.length === 0 ? (
          <Card>
            <EmptyState
              icon={
                <Ionicons
                  name="library-outline"
                  size={26}
                  color={colors.accent}
                />
              }
              title="No courses yet"
              message="Courses assigned to your class will appear here."
            />
          </Card>
        ) : (
          courses.map((course) => {
            const progress = course.lectureCount
              ? Math.round((course.completedCount / course.lectureCount) * 100)
              : 0;
            return (
              <TouchableOpacity
                key={course.courseId}
                activeOpacity={0.78}
                onPress={() => void openCourse(course)}
                style={[
                  styles.courseCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.courseTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.subject, { color: colors.accent }]}>
                      {course.subjectName}
                    </Text>
                    <Text style={[styles.courseTitle, { color: colors.text }]}>
                      {course.title}
                    </Text>
                    <Text style={[styles.teacher, { color: colors.textMuted }]}>
                      By {course.teacherName}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={21}
                    color={colors.textMuted}
                  />
                </View>
                <View style={styles.progressMeta}>
                  <Text
                    style={[styles.progressText, { color: colors.textMuted }]}
                  >
                    {course.completedCount}/{course.lectureCount} lectures
                  </Text>
                  <Text
                    style={[styles.progressText, { color: colors.textMuted }]}
                  >
                    {progress}%
                  </Text>
                </View>
                <View
                  style={[styles.track, { backgroundColor: colors.border }]}
                >
                  <View
                    style={[
                      styles.fill,
                      { backgroundColor: colors.accent, width: `${progress}%` },
                    ]}
                  />
                </View>
              </TouchableOpacity>
            );
          })
        )}
        {pagination.pages > 1 && (
          <View style={styles.pagination}>
            <Button
              title="Previous"
              variant="outline"
              disabled={page <= 1}
              onPress={() => {
                setLoading(true);
                setPage((value) => value - 1);
              }}
            />
            <Text style={[styles.pageText, { color: colors.textMuted }]}>
              {pagination.page} / {pagination.pages}
            </Text>
            <Button
              title="Next"
              variant="outline"
              disabled={page >= pagination.pages}
              onPress={() => {
                setLoading(true);
                setPage((value) => value + 1);
              }}
            />
          </View>
        )}
      </ScreenShell>

      <Modal
        visible={Boolean(selectedCourse)}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedCourse(null)}
      >
        <View
          style={[styles.modalPage, { backgroundColor: colors.background }]}
        >
          <View
            style={[
              styles.modalHeader,
              {
                backgroundColor: colors.surface,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => setSelectedCourse(null)}
              style={[styles.close, { borderColor: colors.border }]}
            >
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={1}
                style={[styles.modalTitle, { color: colors.text }]}
              >
                {selectedCourse?.title}
              </Text>
              <Text style={[styles.modalMeta, { color: colors.textMuted }]}>
                {selectedCourse?.subjectName} · {selectedCourse?.teacherName}
              </Text>
            </View>
          </View>
          {loadingDetail ? (
            <View style={styles.center}>
              <Text style={{ color: colors.textMuted }}>Loading lectures…</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.lectureList}>
              {lectures.map((lecture) => (
                <TouchableOpacity
                  key={lecture.lectureId}
                  activeOpacity={0.76}
                  onPress={() => void watch(lecture)}
                  style={[
                    styles.lectureCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.lectureNumber,
                      {
                        backgroundColor: lecture.readAt
                          ? colors.successBg
                          : colors.primaryBg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.lectureNumberText,
                        {
                          color: lecture.readAt
                            ? colors.success
                            : colors.accent,
                        },
                      ]}
                    >
                      {lecture.sequence}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.lectureTitle, { color: colors.text }]}>
                      {lecture.lectureTitle}
                    </Text>
                    {lecture.description ? (
                      <Text
                        numberOfLines={2}
                        style={[
                          styles.description,
                          { color: colors.textMuted },
                        ]}
                      >
                        {lecture.description}
                      </Text>
                    ) : null}
                    <Text
                      style={[
                        styles.completion,
                        {
                          color: lecture.readAt
                            ? colors.success
                            : colors.textMuted,
                        },
                      ]}
                    >
                      {lecture.readAt
                        ? "Completed"
                        : "Completes when the video ends"}
                    </Text>
                  </View>
                  <Ionicons
                    name={lecture.readAt ? "checkmark-circle" : "play-circle"}
                    size={25}
                    color={lecture.readAt ? colors.success : colors.accent}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>

      <Modal
        visible={Boolean(playingLecture)}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          setPlayingLecture(null);
          setPlaybackUrl("");
        }}
      >
        <View style={styles.playerPage}>
          <View style={styles.playerHeader}>
            <TouchableOpacity
              onPress={() => {
                setPlayingLecture(null);
                setPlaybackUrl("");
              }}
              style={styles.playerClose}
            >
              <Ionicons name="arrow-back" size={23} color="#FFF" />
            </TouchableOpacity>
            <Text numberOfLines={1} style={styles.playerTitle}>
              {playingLecture?.lectureTitle}
            </Text>
          </View>
          {loadingVideo || !playbackUrl || !playingLecture ? (
            <View style={styles.playerCenter}>
              <Text style={styles.playerLoading}>Preparing secure video…</Text>
            </View>
          ) : (
            <LectureVideo
              source={playbackUrl}
              onEnded={() => void markWatched(playingLecture.lectureId)}
            />
          )}
        </View>
      </Modal>
    </>
  );
}

function LectureVideo({
  source,
  onEnded,
}: {
  source: string;
  onEnded: () => void;
}) {
  const player = useVideoPlayer(
    { uri: source, contentType: "hls" },
    (instance) => {
      instance.play();
    },
  );
  useEventListener(player, "playToEnd", onEnded);
  return (
    <View style={styles.playerCenter}>
      <VideoView
        player={player}
        style={styles.video}
        allowsFullscreen
        nativeControls
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  courseCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  courseTop: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  subject: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.xs,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  courseTitle: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.lg,
    marginTop: 4,
  },
  teacher: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    marginTop: 4,
  },
  progressMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.md,
  },
  progressText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.xs,
  },
  track: {
    height: 6,
    overflow: "hidden",
    borderRadius: Radius.full,
    marginTop: Spacing.xs,
  },
  fill: { height: "100%", borderRadius: Radius.full },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  pageText: { fontFamily: Typography.fontFamily, fontSize: Typography.size.sm },
  modalPage: { flex: 1 },
  modalHeader: {
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  close: {
    width: 42,
    height: 42,
    borderWidth: 1,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.lg,
  },
  modalMeta: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    marginTop: 2,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  lectureList: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  lectureCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  lectureNumber: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  lectureNumberText: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.sm,
  },
  lectureTitle: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.md,
  },
  description: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    lineHeight: 19,
    marginTop: 3,
  },
  completion: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.xs,
    marginTop: Spacing.xs,
  },
  playerPage: { flex: 1, backgroundColor: "#05070A" },
  playerHeader: {
    paddingTop: 48,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  playerClose: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  playerTitle: {
    flex: 1,
    color: "#FFF",
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.md,
  },
  playerCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  playerLoading: {
    color: "rgba(255,255,255,.72)",
    fontFamily: Typography.fontFamily,
  },
  video: { width: "100%", aspectRatio: 16 / 9 },
});
