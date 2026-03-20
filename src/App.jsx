import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Home from './pages/Home.jsx';
import CreateAccount from './pages/CreateAccount.jsx';
import Signin from './pages/Signin.jsx';
import Features from './pages/Features.jsx';
import Pricing from './pages/Pricing.jsx';
import Contact from './pages/Contact.jsx';

import ProtectedRoute from './components/ProtectedRoute.jsx';
import PublicRoute from './components/PublicRoute.jsx';

import DashboardLayout from './pages/dashboard/DashboardLayout.jsx';
import DashboardOverview from './pages/dashboard/DashboardOverview.jsx';
import DashboardSessions from './pages/dashboard/DashboardSessions.jsx';
import DashboardGroups from './pages/dashboard/DashboardGroups.jsx';
import DashboardCollaborators from './pages/dashboard/DashboardCollaborators.jsx';
import StudyRoom from './pages/dashboard/StudyRoom.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route
          path="/create-account"
          element={
            <PublicRoute>
              <CreateAccount />
            </PublicRoute>
          }
        />
        <Route
          path="/signin"
          element={
            <PublicRoute>
              <Signin />
            </PublicRoute>
          }
        />
        <Route path="/features" element={<Features />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/contact" element={<Contact />} />
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardOverview />} />
          <Route path="sessions" element={<DashboardSessions />} />
          <Route path="groups" element={<DashboardGroups />} />
          <Route path="collaborators" element={<DashboardCollaborators />} />
        </Route>

        <Route
          path="/dashboard/room/:meetingId"
          element={
            <ProtectedRoute>
              <StudyRoom />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

