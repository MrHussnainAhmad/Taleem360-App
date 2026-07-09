import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, AppState, AppStateStatus, useColorScheme, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { apiClient } from '@/utils/api';
import { Button } from '@/components/ui/Button';
import { SkeletonPage } from '@/components/ui/Skeleton';

type Question = {
  id: number;
  questionType: 'MCQ' | 'SHORT';
  prompt: string;
  options: string[] | null;
  marks: number;
  correctOptionIndex?: number | null;
};

type TestDetails = {
  id: number;
  title: string;
  subjectName: string;
  durationMinutes: number;
  mode: 'MCQ' | 'MIX';
};

export default function TakeTestScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [testDetails, setTestDetails] = useState<TestDetails | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [failureReason, setFailureReason] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [expiresAtMs, setExpiresAtMs] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  
  const [isReviewing, setIsReviewing] = useState(false);
  const [totalScore, setTotalScore] = useState<number | null>(null);
  
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    fetchTestDetails();
  }, [id]);

  const fetchTestDetails = async () => {
    try {
      setLoading(true);
      const data = await apiClient(`/api/student/tests/${id}`);
      setTestDetails(data.test);
      setQuestions(data.questions || []);
      
      if (data.submission) {
        if (data.submission.answers) {
          setAnswers(data.submission.answers);
        }
        if (data.submission.status && data.submission.status !== 'IN_PROGRESS') {
          setIsReviewing(true);
          setTotalScore(data.submission.totalScore);
          setStarted(true);
        } else {
          setStarted(true);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load test details');
    } finally {
      setLoading(false);
    }
  };

  const failTest = async (reason: 'tab_switch' | 'timeout' | 'disconnect') => {
    setFailed(true);
    setFailureReason(reason);
    setStarted(false);
    try {
      await apiClient('/api/student/tests/fail', {
        method: 'POST',
        body: JSON.stringify({ onlineTestId: Number(id), reason })
      });
      Alert.alert('Test Failed', `Your test was automatically failed due to: ${reason}`);
    } catch (e) {
      console.error('Failed to report test failure', e);
    }
  };

  const startTest = async () => {
    setIsStarting(true);
    try {
      const response = await apiClient('/api/student/tests/start', {
        method: 'POST',
        body: JSON.stringify({ onlineTestId: Number(id) })
      });
      
      if (response.expiresAt) {
        const nextExpiresAt = new Date(response.expiresAt).getTime();
        setExpiresAtMs(nextExpiresAt);
        setRemainingSeconds(Math.max(0, Math.ceil((nextExpiresAt - Date.now()) / 1000)));
        setStarted(true);
      }
    } catch (err: any) {
      setError(err.message || 'Could not start the test');
      setFailed(true);
      setFailureReason(err.message);
    } finally {
      setIsStarting(false);
    }
  };

  const submitTest = async () => {
    // Validate all answered
    for (const q of questions) {
      if (answers[q.id] === undefined || answers[q.id] === '') {
        Alert.alert('Incomplete', 'Please answer all questions before submitting.');
        return;
      }
    }

    Alert.alert(
      'Submit Test',
      'Are you sure you want to submit your test? You cannot change your answers after submission.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Submit', 
          style: 'default',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              await apiClient(`/api/student/tests/${id}/submit`, {
                method: 'POST',
                body: JSON.stringify({ answers })
              });
              Alert.alert('Success', 'Test submitted successfully!', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (err: any) {
              Alert.alert('Submission Failed', err.message || 'Failed to submit test');
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    if (!started || failed) return;

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
        // App went to background (tab switch anti-cheat)
        failTest('tab_switch');
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [started, failed]);

  useEffect(() => {
    if (!started || failed || !expiresAtMs) return;
    
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        failTest('timeout');
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [expiresAtMs, started, failed]);

  useEffect(() => {
    if (!started || failed) return;

    const heartbeat = setInterval(() => {
      apiClient('/api/student/tests/heartbeat', {
        method: 'POST',
        body: JSON.stringify({ onlineTestId: Number(id) })
      }).then((res) => {
        if (!res.ok && res.reason === 'timeout') {
          failTest('timeout');
        }
      }).catch(() => {});
    }, 15000);

    return () => clearInterval(heartbeat);
  }, [started, failed]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const setAnswer = (questionId: number, answer: string | number) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  if (loading) {
    return <SkeletonPage title="Test" subtitle="Loading questions and rules." eyebrow="Online test" iconName="document-text-outline" variant="test" rows={5} />;
  }

  if (error || !testDetails) {
    return (
      <View style={[styles.center, { backgroundColor: themeColors.background, padding: Spacing.xl }]}>
        <Ionicons name="alert-circle-outline" size={64} color={themeColors.error} style={{ marginBottom: Spacing.md }} />
        <Text style={[styles.errorText, { color: themeColors.text }]}>{error || 'Test not found'}</Text>
        <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: Spacing.xl }} />
      </View>
    );
  }

  if (failed) {
    return (
      <View style={[styles.center, { backgroundColor: themeColors.background, padding: Spacing.xl }]}>
        <Ionicons name="warning-outline" size={64} color={themeColors.error} style={{ marginBottom: Spacing.md }} />
        <Text style={[styles.title, { color: themeColors.text, marginBottom: Spacing.sm, textAlign: 'center' }]}>Test Failed</Text>
        <Text style={[styles.subtitle, { color: themeColors.textMuted, textAlign: 'center' }]}>
          Your test was failed. Reason: {failureReason === 'tab_switch' ? 'You switched apps or minimized the screen during the test.' : failureReason === 'timeout' ? 'You ran out of time.' : failureReason}
        </Text>
        <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: Spacing.xl }} />
      </View>
    );
  }

  if (!started) {
    return (
      <ScrollView contentContainerStyle={[styles.startContainer, { backgroundColor: themeColors.background, paddingTop: Math.max(insets.top - Spacing.sm, 0) }]}>
        <Ionicons name="document-text-outline" size={64} color={themeColors.primary} style={{ marginBottom: Spacing.md }} />
        <Text style={[styles.title, { color: themeColors.text, textAlign: 'center' }]}>{testDetails.title}</Text>
        <Text style={[styles.subtitle, { color: themeColors.textMuted, textAlign: 'center', marginBottom: Spacing.xl }]}>{testDetails.subjectName}</Text>
        
        <View style={[styles.infoBox, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={themeColors.text} />
            <Text style={[styles.infoText, { color: themeColors.text }]}>Duration: {testDetails.durationMinutes} Minutes</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="list-outline" size={20} color={themeColors.text} />
            <Text style={[styles.infoText, { color: themeColors.text }]}>Questions: {questions.length}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="warning-outline" size={20} color={themeColors.warning} />
            <Text style={[styles.infoText, { color: themeColors.warning, flex: 1 }]}>
              Anti-cheat is active. Do NOT minimize the app, switch tabs, or open notifications during the test, or you will automatically fail.
            </Text>
          </View>
        </View>

        <Button 
          title={isStarting ? "Starting..." : "Start Test"} 
          onPress={startTest} 
          disabled={isStarting}
          style={{ width: '100%', marginTop: Spacing.xl }} 
        />
        <Button 
          title="Cancel" 
          variant="ghost"
          onPress={() => router.back()} 
          disabled={isStarting}
          style={{ width: '100%', marginTop: Spacing.sm }} 
        />
      </ScrollView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={[styles.testHeader, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border, paddingTop: Math.max(insets.top - Spacing.sm, 0) }]}>
        <Text style={[styles.testTitle, { color: themeColors.text }]} numberOfLines={1}>{testDetails.title}</Text>
        {isReviewing ? (
          <View style={[styles.timerBadge, { backgroundColor: themeColors.success + '20' }]}>
            <Text style={[styles.timerText, { color: themeColors.success }]}>Score: {totalScore}</Text>
          </View>
        ) : (
          <View style={styles.timerBadge}>
            <Ionicons name="time-outline" size={16} color={remainingSeconds < 60 ? themeColors.error : themeColors.text} />
            <Text style={[styles.timerText, { color: remainingSeconds < 60 ? themeColors.error : themeColors.text }]}>
              {formatTime(remainingSeconds)}
            </Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.questionsContainer}>
        {questions.map((q, index) => (
          <View key={q.id} style={[styles.questionCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={styles.questionHeader}>
              <Text style={[styles.questionNumber, { color: themeColors.textMuted }]}>Question {index + 1}</Text>
              <Text style={[styles.questionMarks, { color: themeColors.primary }]}>{q.marks} Marks</Text>
            </View>
            <Text style={[styles.prompt, { color: themeColors.text }]}>{q.prompt}</Text>

            {q.questionType === 'MCQ' && q.options && (
              <View style={styles.optionsList}>
                {q.options.map((opt, optIdx) => {
                  const isSelected = answers[q.id] === optIdx;
                  const isCorrect = isReviewing && q.correctOptionIndex === optIdx;
                  const isWrong = isReviewing && isSelected && q.correctOptionIndex !== optIdx;
                  let borderColor = themeColors.border;
                  let bgColor = 'transparent';
                  if (isCorrect) {
                    borderColor = themeColors.success; bgColor = themeColors.success + '15';
                  } else if (isWrong) {
                    borderColor = themeColors.error; bgColor = themeColors.error + '15';
                  } else if (isSelected && !isReviewing) {
                    borderColor = themeColors.primary; bgColor = themeColors.primary + '15';
                  }

                  return (
                    <TouchableOpacity
                      key={optIdx}
                      style={[styles.optionButton, { borderColor, backgroundColor: bgColor }]}
                      onPress={() => !isReviewing && setAnswer(q.id, optIdx)}
                      disabled={isReviewing}
                    >
                      <View style={[styles.radioOuter, { borderColor: isSelected || isCorrect || isWrong ? borderColor : themeColors.border }]}>
                        {(isSelected || isCorrect || isWrong) && <View style={[styles.radioInner, { backgroundColor: borderColor }]} />}
                      </View>
                      <Text style={[styles.optionText, { color: themeColors.text }]}>{opt}</Text>
                      {isCorrect && <Ionicons name="checkmark-circle" size={18} color={themeColors.success} />}
                      {isWrong && <Ionicons name="close-circle" size={18} color={themeColors.error} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {q.questionType === 'SHORT' && (
                <TextInput
                  style={[styles.textInput, { color: themeColors.text, borderColor: themeColors.border, backgroundColor: themeColors.background }]}
                  placeholder="Type your answer here..."
                  placeholderTextColor={themeColors.textMuted}
                  multiline
                  editable={!isReviewing}
                  value={(answers[q.id] as string) || ''}
                  onChangeText={(text) => setAnswer(q.id, text)}
                />
            )}
          </View>
        ))}

        {!isReviewing && (
          <Button 
            title={isSubmitting ? "Submitting..." : "Submit Test"} 
            onPress={submitTest}
            disabled={isSubmitting}
            style={styles.submitButton}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startContainer: {
    flexGrow: 1,
    alignItems: 'center',
    padding: Spacing.xl,
  },
  title: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.xl,
  },
  subtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.md,
    marginTop: Spacing.xs,
  },
  errorText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.lg,
    textAlign: 'center',
  },
  infoBox: {
    width: '100%',
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  infoText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    lineHeight: 20,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  testTitle: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.lg,
    flex: 1,
    marginRight: Spacing.md,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 4,
  },
  timerText: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.md,
    fontVariant: ['tabular-nums'],
  },
  questionsContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl * 2,
  },
  questionCard: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  questionNumber: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.xs,
    textTransform: 'uppercase',
  },
  questionMarks: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.xs,
  },
  prompt: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.md,
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  optionsList: {
    gap: Spacing.sm,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    flex: 1,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    minHeight: 100,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  }
});
