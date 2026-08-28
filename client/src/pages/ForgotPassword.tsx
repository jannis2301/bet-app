import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../components';
import { useAppContext } from '../context/appContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const { isLoading, showAlert, forgotPassword } = useAppContext();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    forgotPassword(email);
  };

  return (
    <section className="register-box">
      <div className="form-container">
        {showAlert && <Alert />}
        <h1>Forgot Password</h1>
        <form className="form" onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            value={email}
            onChange={handleChange}
            placeholder="Enter your email..."
            autoComplete="email"
            required
          />
          <button type="submit" className="btn btn-block" disabled={isLoading}>
            Send reset link
          </button>
          <p>
            <Link to="/register" className="btn member-btn">
              Back to login
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
};

export default ForgotPassword;
