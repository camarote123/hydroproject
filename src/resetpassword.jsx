import bcrypt from 'bcryptjs'; // Import bcryptjs
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './createClient';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem('resetEmail'); // Get the email from localStorage

    if (!email) {
      setError('Email address is missing.');
      navigate('/'); // Redirect if no email is found
    }
  }, [navigate]);

  // Function to check password strength
  const isStrongPassword = (password) => {
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();

    const email = localStorage.getItem('resetEmail'); // Get the email

    if (!password || !confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!isStrongPassword(password)) {
      setError(
        'Password must be at least 8 characters long, include at least one uppercase letter, one lowercase letter, one number, and one special character.'
      );
      return;
    }

    if (!email) {
      setError('Email address is missing.');
      return;
    }

    try {
      // Hash the new password before storing it in Supabase
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update the password in Supabase
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: hashedPassword })
        .eq('email', email);

      if (updateError) {
        setError('Error updating password: ' + updateError.message);
        return;
      }

      setSuccess('Password successfully updated! Redirecting...');

      // Redirect to the PasswordChanged page after a successful reset
      setTimeout(() => {
        localStorage.removeItem('resetEmail'); // Clear the stored email
        navigate('/passwordchanged'); // Redirect to Password Changed page
      }, 2000);
    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  return (
    <div className="container">
      <h2>Enter New Password</h2>
      <form onSubmit={handlePasswordReset}>
        <div>
          <label htmlFor="password">New Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Reset Password</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </div>
  );
};

export default ResetPassword;
