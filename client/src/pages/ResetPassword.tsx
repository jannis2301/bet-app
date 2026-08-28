import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { BsEyeFill, BsEyeSlashFill } from 'react-icons/bs';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert } from '../components';
import { useAppContext } from '../context/appContext';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { user, isLoading, showAlert, displayAlert, resetPassword } =
    useAppContext();
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || !password || password !== confirmPassword) {
      displayAlert();
      return;
    }
    resetPassword({ token, password });
  };

  useEffect(() => {
    if (user) {
      setTimeout(() => {
        navigate('/');
      }, 1000);
    }
  }, [user, navigate]);

  return (
    <section className="register-box">
      <div className="form-container">
        {showAlert && <Alert />}
        <h1>Reset Password</h1>
        {token ? (
          <form className="form" onSubmit={handleSubmit}>
            <div className="password-container">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter your new password..."
                minLength={8}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="toggle-password-btn"
              >
                {showPassword ? <BsEyeFill /> : <BsEyeSlashFill />}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setConfirmPassword(e.target.value)
              }
              placeholder="Confirm your new password..."
              minLength={8}
              autoComplete="new-password"
              required
            />
            <button
              type="submit"
              className="btn btn-block"
              disabled={isLoading}
            >
              Reset password
            </button>
          </form>
        ) : (
          <p>
            This link is invalid.{' '}
            <Link to="/forgot-password">Request a new one</Link>.
          </p>
        )}
      </div>
    </section>
  );
};

export default ResetPassword;
