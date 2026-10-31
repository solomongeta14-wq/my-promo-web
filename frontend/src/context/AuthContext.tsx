import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../utils/api'
import { User } from '../types'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (data: { email: string; password: string; name: string; role?: string }) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await authApi.me()
      setUser(data.user)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password })
    setUser(data.user)
  }

  const logout = async () => {
    await authApi.logout()
    setUser(null)
  }

  const register = async (userData: { email: string; password: string; name: string; role?: string }) => {
    const { data } = await authApi.register(userData)
    setUser(data.user)
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await authApi.changePassword({ currentPassword, newPassword })
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, changePassword, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}