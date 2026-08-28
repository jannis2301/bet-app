import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import Loading from '../components/Loading';
import { useAppContext } from '../context/appContext';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, userLoading } = useAppContext();

  if (userLoading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/register"></Navigate>;
  }
  return children;
};

export default ProtectedRoute;
