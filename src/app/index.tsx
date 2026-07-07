import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { SkeletonPage } from '@/components/ui/Skeleton';

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <SkeletonPage title="Taleem360" subtitle="Preparing your portal." eyebrow="Loading" iconName="school-outline" variant="dashboard" />;
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (user.role === 'STUDENT') {
    return <Redirect href="/(student)" />;
  }

  if (user.role === 'STAFF') {
    return <Redirect href="/(staff)" />;
  }

  // Fallback
  return <Redirect href="/login" />;
}
