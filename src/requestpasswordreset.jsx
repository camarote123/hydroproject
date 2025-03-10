import bcrypt from 'bcryptjs'; // Import bcryptjs for password comparison
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './aqua.css';
import { supabase } from './createClient'; // Assuming supabase is set up
import logo from "/src/assets/logo.png";


const RequestPasswordResetPage = () => {
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handlePasswordResetRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !currentPassword) {
      setError('Please enter both email and current password.');
      return;
    }

    try {
      // Check if the email exists in the Supabase database
      const { data, error: userError } = await supabase
        .from('users') // Assuming 'users' is the table where email and password are stored
        .select('email, password') // Fetch both email and password
        .eq('email', email)
        .single();

      if (userError || !data) {
        setError('Email not found in our records.');
        return;
      }

      const hashedPassword = data.password;

      // Verify current password using bcryptjs
      const isMatch = await bcrypt.compare(currentPassword, hashedPassword);
      if (!isMatch) {
        setError('Incorrect current password.');
        return;
      }

      // Success - Email and password verified
      setSuccess('Password verified! Redirecting to reset your password...');
      localStorage.setItem('resetEmail', email); // Save email in local storage for reset
      setTimeout(() => {
        navigate(`/resetpassword?email=${encodeURIComponent(email)}`);
      }, 2000);

    } catch (error) {
      setError('Error: ' + error.message);
    }
  };

  return (

    <div class="container">
      <img src={logo} alt="Logo" className="logo-img2" />
      <h2>Request Password Reset</h2>
      <form onSubmit={handlePasswordResetRequest}>
        <div>
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
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
        <button type="submit">Verify and Proceed</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </div>
  );
};

export default RequestPasswordResetPage;
