import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const userSession = JSON.parse(localStorage.getItem('userSession'));

  if (!userSession) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;