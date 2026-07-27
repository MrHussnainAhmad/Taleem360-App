import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient, subscribeToSessionExpired } from '@/utils/api';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync } from '@/utils/notifications';
import { clearAuthTokens, getRefreshToken, setAuthTokens } from '@/utils/auth-storage';
import { jwtDecode } from 'jwt-decode';

type Role = 'STUDENT' | 'STAFF' | null;
type StudentAcademicStatus = 'ACTIVE' | 'GRADUATED';

interface User {
  role: Role;
  studentAcademicStatus?: StudentAcademicStatus;
  graduatedStudentAccessAllowed?: boolean;
}

interface Brand {
  name: string;
  logoKey: string | null;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  brand: Brand | null;
  isLoading: boolean;
  login: (role: Role, accessToken: string, refreshToken: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshBrand: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    return subscribeToSessionExpired(() => {
      setUser(null);
      setBrand(null);
      void Promise.all([
        AsyncStorage.removeItem('user'),
        AsyncStorage.removeItem('brand'),
      ]).finally(() => router.replace('/login'));
    });
  }, [router]);

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        // Push token registration happens on login or when the user taps Enable.
      }
      const storedBrand = await AsyncStorage.getItem('brand');
      if (storedBrand) {
        setBrand(JSON.parse(storedBrand));
      }
    } catch (e) {
      console.error('Failed to load user from storage', e);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBrand = async () => {
    try {
      const data = await apiClient('/api/me/brand');
      setBrand(data);
      await AsyncStorage.setItem('brand', JSON.stringify(data));
    } catch (err) {
      console.error('Failed to fetch brand', err);
    }
  };

  const login = async (role: Role, accessToken: string, refreshToken: string) => {
    let decoded: Partial<User> = {};
    try {
      decoded = jwtDecode<Partial<User>>(accessToken);
    } catch {
      decoded = {};
    }
    const newUser: User = {
      role,
      studentAcademicStatus: decoded.studentAcademicStatus,
      graduatedStudentAccessAllowed: decoded.graduatedStudentAccessAllowed,
    };
    try {
      await setAuthTokens(accessToken, refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      await refreshBrand();
      await registerForPushNotificationsAsync();
    } catch (e) {
      console.error('Failed to save user to storage', e);
    }
    return newUser;
  };

  const logout = async () => {
    try {
      const refreshToken = await getRefreshToken();
      await apiClient('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } catch (e) {
      console.warn('Logout API failed:', e);
    }
    setUser(null);
    setBrand(null);
    try {
      await clearAuthTokens();
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('brand');
    } catch (e) {
      console.error('Failed to remove user from storage', e);
    }
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ user, brand, isLoading, login, logout, refreshBrand }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
