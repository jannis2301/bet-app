import { Navigate } from 'react-router-dom';
import { useAppContext } from '../context/appContext';
import Loading from '../components/Loading';

const ProtectedRoute = ({ children }) => {
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
