import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface AuthState {
  token: string | null
  email: string | null
  roleId: number | null
  setToken: (token: string | null) => void;
  setEmail: (email: string | null) => void;
  setRoleId: (roleId: number | null) => void;
  logout: () => void
  getStoredToken: () => string | null
  getStoredEmail: () => string | null
  getStoredRoleID: () => number | null
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      email: null,
      roleId: null,
      setToken: (token) => set({ token }),
      setEmail: (email) => set({ email }),
      setRoleId: (roleId) => set({ roleId }),
      logout: () => {
        // Clear zustand state
        set({ token: null, email: null, roleId: null })
        
        // Clear storage
        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem('auth-storage')
          window.localStorage.removeItem('auth-storage')
          window.location.href = '/'
        }
      },
      getStoredToken: () => {
        if (typeof window === 'undefined') return null
      
        // Check session storage first
        let stored = window.sessionStorage.getItem('auth-storage')
        if (!stored) {
          // Fallback to local storage if not found in session storage
          stored = window.localStorage.getItem('auth-storage')
        }
        if (!stored) return null
      
        try {
          const parsed = JSON.parse(stored)
          return parsed.state?.token || null
        } catch {
          return null
        }
      },
      getStoredEmail: () => {
        if (typeof window === 'undefined') return null
        
        const stored = window.sessionStorage.getItem('auth-storage')
        if (!stored) return null
        
        try {
          const parsed = JSON.parse(stored)
          return parsed.state?.email || null
        } catch {
          return null
        }
      },
      getStoredRoleID: () => {
        if (typeof window === 'undefined') return null
      
        // Check session storage first
        let stored = window.sessionStorage.getItem('auth-storage')
        if (!stored) {
          // Fallback to local storage if not found in session storage
          stored = window.localStorage.getItem('auth-storage')
        }
        if (!stored) return null
      
        try {
          const parsed = JSON.parse(stored)
          return parsed.state?.roleId || null
        } catch {
          return null
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') {
          return localStorage  // Changed from sessionStorage to localStorage
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {}
        }
      }),
      partialize: (state) => ({ token: state.token, email: state.email, roleId: state.roleId }),
    }
  )
)