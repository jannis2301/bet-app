import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import { Alert } from '../../components';
import { useAppContext } from '../../context/appContext';
import type { User } from '../../types';

const initialPasswordValues = {
  oldPassword: '',
  newPassword: '',
  confirmNewPassword: '',
};

const Profile = () => {
  const {
    user,
    showAlert,
    displayAlert,
    updateUser,
    updatePassword,
    isLoading,
  } = useAppContext();
  // Profile is only ever reached through ProtectedRoute, which already
  // guarantees a logged-in user before rendering its children.
  const currentUser = user as User;
  const [values, setValues] = useState({
    name: currentUser.name,
    email: currentUser.email,
    location: currentUser.location,
    team: currentUser.team,
  });
  const [passwordValues, setPasswordValues] = useState(initialPasswordValues);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value, name } = e.target;
    setValues({ ...values, [name]: value });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { name, email } = values;
    if (!name || !email) {
      displayAlert();
      return;
    }
    updateUser(values);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value, name } = e.target;
    setPasswordValues({ ...passwordValues, [name]: value });
  };

  const handlePasswordSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmNewPassword } = passwordValues;
    if (!oldPassword || !newPassword || newPassword !== confirmNewPassword) {
      displayAlert();
      return;
    }
    updatePassword({ oldPassword, newPassword });
    setPasswordValues(initialPasswordValues);
  };

  return (
    <section className="profile-box">
      <form onSubmit={handleSubmit}>
        <h1>Profile</h1>
        {showAlert && <Alert />}
        <div className="form-center">
          <div className="label-box">
            <label htmlFor="name">Username</label>
            <input
              type="text"
              id="name"
              name="name"
              value={values.name}
              onChange={handleChange}
              autoComplete="name"
              required
            />
          </div>
          <div className="label-box">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={values.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>
          <div className="label-box">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={values.location}
              onChange={handleChange}
            />
          </div>
          <div className="label-box">
            <label htmlFor="team">Favorite Team</label>
            <input
              type="text"
              id="team"
              name="team"
              value={values.team}
              onChange={handleChange}
            />
          </div>
        </div>
        <button type="submit" className="btn" disabled={isLoading}>
          Submit
        </button>
      </form>
      <form onSubmit={handlePasswordSubmit}>
        <h1>Change Password</h1>
        <div className="form-center">
          <div className="label-box">
            <label htmlFor="oldPassword">Current Password</label>
            <input
              type="password"
              id="oldPassword"
              name="oldPassword"
              value={passwordValues.oldPassword}
              onChange={handlePasswordChange}
              autoComplete="current-password"
              minLength={8}
              required
            />
          </div>
          <div className="label-box">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={passwordValues.newPassword}
              onChange={handlePasswordChange}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <div className="label-box">
            <label htmlFor="confirmNewPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmNewPassword"
              name="confirmNewPassword"
              value={passwordValues.confirmNewPassword}
              onChange={handlePasswordChange}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
        </div>
        <button type="submit" className="btn" disabled={isLoading}>
          Change Password
        </button>
      </form>
    </section>
  );
};
export default Profile;
