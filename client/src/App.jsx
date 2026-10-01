import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'

import { RedirectIfAuthenticated, RequireAuth } from '@/components/auth/RouteGuards'
import { AuthProvider } from '@/context/AuthProvider'
import { ThemeProvider } from '@/context/ThemeProvider'
import { Dashboard } from '@/pages/Dashboard'
import { History } from '@/pages/History'
import { JobMatcher } from '@/pages/JobMatcher'
import { Landing } from '@/pages/Landing'
import { Login } from '@/pages/Login'
import { NotFound } from '@/pages/NotFound'
import { Privacy } from '@/pages/Privacy'
import { Register } from '@/pages/Register'
import { ResumeAnalysis } from '@/pages/ResumeAnalysis'
import { ResumeDetail } from '@/pages/ResumeDetail'
import { Terms } from '@/pages/Terms'
import { UploadResume } from '@/pages/UploadResume'

function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const element = document.querySelector(hash)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, hash])

  return null
}

function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/login"
          element={
            <RedirectIfAuthenticated>
              <Login />
            </RedirectIfAuthenticated>
          }
        />
        <Route
          path="/register"
          element={
            <RedirectIfAuthenticated>
              <Register />
            </RedirectIfAuthenticated>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/upload"
          element={
            <RequireAuth>
              <UploadResume />
            </RequireAuth>
          }
        />
        <Route
          path="/resumes"
          element={
            <RequireAuth>
              <ResumeDetail />
            </RequireAuth>
          }
        />
        <Route
          path="/resumes/:id"
          element={
            <RequireAuth>
              <ResumeDetail />
            </RequireAuth>
          }
        />
        <Route
          path="/analysis"
          element={
            <RequireAuth>
              <ResumeAnalysis />
            </RequireAuth>
          }
        />
        <Route
          path="/analysis/:id"
          element={
            <RequireAuth>
              <ResumeAnalysis />
            </RequireAuth>
          }
        />
        <Route
          path="/history"
          element={
            <RequireAuth>
              <History />
            </RequireAuth>
          }
        />
        <Route path="/jobs" element={<JobMatcher />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
