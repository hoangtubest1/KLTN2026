import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
// import InstallPrompt from './components/InstallPrompt';
import MobileNavBar from './components/MobileNavBar';
import './App.css';

function AppContent() {
  return (
    <div className="App">
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <ChatBot />
      {/* <InstallPrompt /> */}
      <MobileNavBar />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
