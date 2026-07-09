import { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AuthContext } from '../context/AuthContext';
import './AuthCallback.css';
import * as authService from '../services/authService';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      navigate(`/?error=${encodeURIComponent(error)}`, { replace: true });
      return;
    }

    if (!code) {
      navigate('/?error=missing_params', { replace: true });
      return;
    }

    const finishLogin = async () => {
      try {
        const fetchedUser = await authService.exchangeGoogleCode(code);
        setUser(fetchedUser);
        navigate('/', { replace: true });
      } catch (err) {
        console.error('Failed to complete Google sign-in:', err);
        localStorage.removeItem('accessToken');
        navigate('/?error=oauth_failed', { replace: true });
      }
    };

    finishLogin();
  }, [navigate, setUser]);

  return (
    <div className="auth-callback">
      <LoadingSpinner />
      <p>Signing you in…</p>
    </div>
  );
}
