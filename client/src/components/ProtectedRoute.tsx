import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'wouter';

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  [key: string]: any;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ component: Component, ...rest }) => {
  const { user } = useAuth();

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component {...rest} />;
};
