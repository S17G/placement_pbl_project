import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import AdminDashboardPage from './pages/AdminDashboardPage'
import DiscussionPage from './pages/DiscussionPage'
import FaqPage from './pages/FaqPage'
import LoginPage from './pages/LoginPage'
import PlacementDashboardPage from './pages/PlacementDashboardPage'
import PlacementReadinessPage from './pages/PlacementReadinessPage'
import RegisterPage from './pages/RegisterPage'
import ResumeLibraryPage from './pages/ResumeLibraryPage'

const isAuthenticated = () => sessionStorage.getItem('pmAuth') === 'true'
const getRole = () => sessionStorage.getItem('pmRole') || 'student'

const getDefaultRoute = () => {
  if (!isAuthenticated()) {
    return '/login'
  }

  return getRole() === 'admin' ? '/admin' : '/discussion'
}

function ProtectedRoute({ children, allowedRole }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  if (allowedRole && getRole() !== allowedRole) {
    return <Navigate to={getDefaultRoute()} replace />
  }

  return children
}

function PublicOnlyRoute({ children }) {
  if (isAuthenticated()) {
    return <Navigate to={getDefaultRoute()} replace />
  }

  return children
}

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/discussion"
          element={
            <ProtectedRoute allowedRole="student">
              <DiscussionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faq"
          element={
            <ProtectedRoute allowedRole="student">
              <FaqPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resumes"
          element={
            <ProtectedRoute allowedRole="student">
              <ResumeLibraryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/placements"
          element={
            <ProtectedRoute allowedRole="student">
              <PlacementDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/readiness"
          element={
            <ProtectedRoute allowedRole="student">
              <PlacementReadinessPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
      </Route>
    </Routes>
  )
}

export default App
