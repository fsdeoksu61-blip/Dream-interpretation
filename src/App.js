import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SessionProvider } from './contexts/SessionContext';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import DreamInput from './pages/DreamInput';
import DreamResult from './pages/DreamResult';
import MyDreams from './pages/MyDreams';
import DreamDiary from './pages/DreamDiary';
import QnA from './pages/QnA';
import QnAWrite from './pages/QnAWrite';
import QnADetail from './pages/QnADetail';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SessionProvider>
          <Router>
            <div className="App">
              <ErrorBoundary>
                <Navigation />
              </ErrorBoundary>
              <main className="main-content">
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/dream/new" element={<DreamInput />} />
                    <Route path="/dream/:id" element={<DreamResult />} />
                    <Route path="/my-dreams" element={<MyDreams />} />
                    <Route path="/dream-diary" element={<DreamDiary />} />
                    <Route path="/qna" element={<QnA />} />
                    <Route path="/qna/write" element={<QnAWrite />} />
                    <Route path="/qna/:id" element={<QnADetail />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  </Routes>
                </ErrorBoundary>
              </main>
              <Footer />
            </div>
          </Router>
        </SessionProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
