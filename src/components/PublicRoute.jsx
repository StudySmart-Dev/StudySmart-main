import React from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext.jsx';

export default function PublicRoute({ children }) {
  const { user, booting } = useAuth();
  if (booting) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

