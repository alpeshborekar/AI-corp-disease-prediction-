import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import LoadingSpinner from './components/UI/LoadingSpinner';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import DiseasePrediction from './pages/DiseasePrediction';
import Consultations from './pages/Consultations';
import ConsultationDetail from './pages/ConsultationDetail';
import CreateConsultation from './pages/CreateConsultation';
import Profile from './pages/Profile';
import Weather from './pages/Weather';
import Reports from './pages/Reports';
import AdminDashboard from './pages/admin/AdminDashboard';
import ExpertDashboard from './pages/expert/ExpertDashboard';
import NotFound from './pages/NotFound';

// Styles
import './index.css';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// App Layout Component
const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <div className="bg-farm-pattern">
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <SocketProvider>
            <AppLayout>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                
                {/* Auth Routes */}
                <Route 
                  path="/login" 
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  } 
                />
                <Route 
                  path="/register" 
                  element={
                    <PublicRoute>
                      <Register />
                    </PublicRoute>
                  } 
                />

                {/* Protected Routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/predict" 
                  element={
                    <ProtectedRoute>
                      <DiseasePrediction />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/consultations" 
                  element={
                    <ProtectedRoute>
                      <Consultations />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/consultations/new" 
                  element={
                    <ProtectedRoute>
                      <CreateConsultation />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/consultations/:id" 
                  element={
                    <ProtectedRoute>
                      <ConsultationDetail />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/weather" 
                  element={
                    <ProtectedRoute>
                      <Weather />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/reports" 
                  element={
                    <ProtectedRoute>
                      <Reports />
                    </ProtectedRoute>
                  } 
                />

                {/* Admin Routes */}
                <Route 
                  path="/admin/*" 
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />

                {/* Expert Routes */}
                <Route 
                  path="/expert/*" 
                  element={
                    <ProtectedRoute roles={['expert', 'admin']}>
                      <ExpertDashboard />
                    </ProtectedRoute>
                  } 
                />

                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>

            {/* Global Toast Notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#fff',
                  color: '#374151',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                },
                success: {
                  iconTheme: {
                    primary: '#22c55e',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </SocketProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;