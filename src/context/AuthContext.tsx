import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState } from 'react-native';
import { apiClient, subscribeToSessionExpired } from '@/utils/api';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync } from '@/utils/notifications';
import { clearAuthTokens, getRefreshToken, setAuthTokens } from '@/utils/auth-storage';

type Role = 'STUDENT' | 'STAFF' | null;

interface User {
  role: Role;
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
  login: (role: Role, accessToken: string, refreshToken: string) => Promise<void>;
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

  useEffect(() => {
    if (!user) return;

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        registerForPushNotificationsAsync();
      }
    });

    return () => subscription.remove();
  }, [user]);

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        registerForPushNotificationsAsync();
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
    const newUser = { role };
    try {
      await setAuthTokens(accessToken, refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      await refreshBrand();
      await registerForPushNotificationsAsync();
    } catch (e) {
      console.error('Failed to save user to storage', e);
    }
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
