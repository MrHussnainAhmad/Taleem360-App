import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '@/utils/api';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync } from '@/utils/notifications';

type Role = 'STUDENT' | 'STAFF' | null;

interface User {
  role: Role;
  token?: string;
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
  login: (role: Role, token?: string) => void;
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

  const login = async (role: Role, token?: string) => {
    const newUser = { role, token };
    setUser(newUser);
    try {
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      await refreshBrand();
      await registerForPushNotificationsAsync();
    } catch (e) {
      console.error('Failed to save user to storage', e);
    }
  };

  const logout = async () => {
    try {
      await apiClient('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Logout API failed:', e);
    }
    setUser(null);
    setBrand(null);
    try {
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
