'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { getMe, login as apiLogin, register as apiRegister, logout as apiLogout, isLoggedIn, updateProfile as apiUpdateProfile, updatePassword as apiUpdatePassword, deleteAccount as apiDeleteAccount } from '@/lib/api';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn()) {
      getMe()
        .then((data) => setUser(data.user))
        .catch(() => {
          apiLogout();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setTimeout(() => setLoading(false), 0);
    }
  }, []);

  const login = async (email, password) => {
    const data = await apiLogin(email, password);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await apiRegister(name, email, password);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    apiLogout();
    setUser(null);
    router.push('/login');
  };

  const updateProfile = async (name) => {
    const data = await apiUpdateProfile(name);
    setUser(data.user);
    return data;
  };

  const updatePassword = async (currentPassword, newPassword) => {
    return apiUpdatePassword(currentPassword, newPassword);
  };

  const deleteAccount = async () => {
    await apiDeleteAccount();
    apiLogout();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, updatePassword, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
