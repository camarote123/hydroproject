import bcrypt from 'bcryptjs'; // For password comparison
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './aqua.css';
import { supabase } from './createClient'; // Ensure Supabase is correctly configured

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      // Fetch user data from Supabase based on email
      const { data, error: userError } = await supabase
        .from('users')
        .select('email, password, position') // Select email, password, and position fields
        .eq('email', email)
        .single();

      if (userError || !data) {
        setError('Email not found.');
        return;
      }

      // Compare entered password with the stored hashed password
      const isMatch = await bcrypt.compare(password, data.password);
      if (!isMatch) {
        setError('Incorrect password.');
        return;
      }

      // Check if the user is an admin (Optional)
      if (data.position !== 'admin') {
        setError('You do not have admin privileges.');
        return;
      }

      setSuccess('Login successful! Redirecting to the Dashboard...');
      
      // Redirect to the Dashboard after successful login
      setTimeout(() => {
        navigate('/dashboard'); // Redirect to dashboard
      }, 1000);

    } catch (error) {
      setError('Error: ' + error.message);
    }
  };

  return (
    <div className="container">
      <img src="/logo.png" alt="Logo" className="logo-img1" />
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div >
          <label htmlFor="password">Password</label>
          <br />
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit">Login</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </div>
  );
};

export default Login;
