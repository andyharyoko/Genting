import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import KaderDashboard from './pages/KaderDashboard';
import BidanDashboard from './pages/BidanDashboard';
import PuskesmasDashboard from './pages/PuskesmasDashboard';
import KabupatenDashboard from './pages/KabupatenDashboard';
import OrangTuaDashboard from './pages/OrangTuaDashboard';
import GisDashboard from './pages/GisDashboard';
import DaftarBalitaPage from './pages/DaftarBalitaPage';
import ProfilKaderPage from './pages/ProfilKaderPage';

import './index.css'; // Ensure tailwind is loaded

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
        return <Navigate to="/" replace />;
    }
    
    const user = JSON.parse(userStr);
    
    // Roles 0-3 are Dashboard, Roles 4-7 are GIS
    // Or we could strictly check `allowedRoles.includes(user.role_level)`
    return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        
        <Route path="/orangtua-dashboard" element={
          <ProtectedRoute allowedRoles={[0]}>
            <OrangTuaDashboard />
          </ProtectedRoute>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={[1, 3]}>
            <KaderDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/bidan-dashboard" element={
          <ProtectedRoute allowedRoles={[2]}>
            <BidanDashboard />
          </ProtectedRoute>
        } />

        <Route path="/puskesmas-dashboard" element={
          <ProtectedRoute allowedRoles={[3]}>
            <PuskesmasDashboard />
          </ProtectedRoute>
        } />

        <Route path="/kabupaten-dashboard" element={
          <ProtectedRoute allowedRoles={[4]}>
            <KabupatenDashboard />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/balita" element={
          <ProtectedRoute allowedRoles={[0, 1, 2, 3]}>
            <DaftarBalitaPage />
          </ProtectedRoute>
        } />
        
        <Route path="/gis" element={
          <ProtectedRoute allowedRoles={[4, 5, 6, 7]}>
            <GisDashboard />
          </ProtectedRoute>
        } />

        <Route path="/profil" element={
          <ProtectedRoute allowedRoles={[0, 1, 2, 3, 4, 5]}>
            <ProfilKaderPage />
          </ProtectedRoute>
        } />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
