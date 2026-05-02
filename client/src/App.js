import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Booking from './pages/Booking';
import BookingsList from './pages/BookingsList';
import AdminDashboard from './pages/AdminDashboard';
import FieldsList from './pages/FieldsList';
import TermsOfService from './pages/TermsOfService';
import ForgotPassword from './pages/ForgotPassword';
import FacilityDetail from './pages/FacilityDetail';
import Profile from './pages/Profile';
import Statistics from './pages/Statistics';
import NotFound from './pages/NotFound';
import Contact from './pages/Contact';
import OwnerLanding from './pages/OwnerLanding';
import AdminRoute from './components/AdminRoute';
import ChatBot from './components/ChatBot';
import PaymentResult from './pages/PaymentResult';
import NewsDetail from './pages/NewsDetail';
import FindMate from './pages/CasualGroup';
import FindMateDetail from './pages/CasualGroupDetail';
import FindMateCreate from './pages/CasualGroupCreate';
import MyFindMate from './pages/MyCasualGroups';
import Notifications from './pages/Notifications';
// import InstallPrompt from './components/InstallPrompt';
import MobileNavBar from './components/MobileNavBar';
import ScrollToTop from './components/ScrollToTop';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import './App.css';

// Toast popup khi có thông báo mới
const NotificationToast = () => {
  const { toast, setToast } = useNotification();
  if (!toast) return null;

  const icons = { booking_confirmed: '✅', booking_cancelled: '❌', group_join: '👋', group_leave: '🚪', group_kick: '⚠️', group_created: '🎉', group_message: '💬', system: '🔔' };

  return (
    <div
      className="fixed top-20 right-4 z-[9999] max-w-sm w-full animate-in"
      style={{ animation: 'slideInRight 0.3s ease-out' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 flex items-start gap-3 cursor-pointer hover:shadow-xl transition-shadow"
        onClick={() => setToast(null)}
      >
        <span className="text-2xl">{icons[toast.type] || '🔔'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">{toast.title}</p>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{toast.message}</p>
        </div>
        <button onClick={(e) => { e.stopPropagation(); setToast(null); }} className="text-gray-300 hover:text-gray-500 p-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

function AppContent() {
  return (
    <div className="App">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/fields" element={<FieldsList />} />
          <Route path="/facility/:id" element={<FacilityDetail />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route
            path="/booking/:sportId?"
            element={
              <ProtectedRoute>
                <Booking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <BookingsList />
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
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/statistics"
            element={
              <AdminRoute>
                <Statistics />
              </AdminRoute>
            }
          />
          <Route path="/contact" element={<Contact />} />
          <Route path="/owner" element={<OwnerLanding />} />
          <Route path="/payment/result" element={<PaymentResult />} />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route
            path="/casual-group"
            element={
              <ProtectedRoute>
                <FindMate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/casual-group/:id"
            element={
              <ProtectedRoute>
                <FindMateDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/casual-group/join/:roomCode"
            element={
              <ProtectedRoute>
                <FindMateDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/casual-group/create"
            element={
              <ProtectedRoute>
                <FindMateCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-casual-groups"
            element={
              <ProtectedRoute>
                <MyFindMate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <ChatBot />
      <NotificationToast />
      {/* <InstallPrompt /> */}
      <MobileNavBar />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <Router>
            <AppContent />
          </Router>
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
