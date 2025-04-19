import React, { JSX } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const authToken = localStorage.getItem('authToken'); // Check for auth token in localStorage
  const location = useLocation();

  if (!authToken) {
    // Pass a state to the Navigate component
    return <Navigate to="/" replace state={{ from: location, unauthorized: true }} />;
  }

  return children; // Render the protected component if authenticated
};

export default ProtectedRoute;