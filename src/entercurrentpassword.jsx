import bcrypt from 'bcryptjs'; // For password comparison
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './createClient';

const EnterCurrentPassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const email = localStorage.getItem('resetEmail'); // Get the email from localStorage

  const handlePasswordVerification = async (e) => {
    e.preventDefault();

    if (!currentPassword) {
      setError('Please enter your current password.');
      return;
    }

    try {
      // Fetch the hashed password from the database
      const { data, error: userError } = await supabase
        .from('users')
        .select('password') // Get the hashed password from the 'users' table
        .eq('email', email)
        .single();

      if (userError || !data) {
        setError('User not found.');
        return;
      }

      const hashedPassword = data.password;

      // Compare the entered current password with the hashed password
      const isMatch = await bcrypt.compare(currentPassword, hashedPassword);
      if (!isMatch) {
        setError('Incorrect current password.');
        return;
      }

      // Success - Redirect to reset password page
      setSuccess('Password verified! Redirecting to reset your password...');
      setTimeout(() => {
        navigate(`/resetpassword?email=${encodeURIComponent(email)}`); // Redirect to reset page
      }, 2000);

    } catch (error) {
      setError('Error: ' + error.message);
    }
  };

  return (
    <div>
      <h2>Enter Current Password</h2>
      <form onSubmit={handlePasswordVerification}>
        <div>
          <label htmlFor="currentPassword">Current Password</label>
          <input
            type="password"
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit">Verify Current Password</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </div>
  );
};

export default EnterCurrentPassword;
