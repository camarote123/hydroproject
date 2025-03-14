import bcrypt from 'bcryptjs'; // For password comparison
import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Install react-icons if needed
import { useNavigate } from 'react-router-dom';
import './aqua.css';
import { supabase } from './createClient'; // Ensure Supabase is correctly configured
import logo from "/src/assets/logo.png";


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

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
        .select('email, password, position')
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
      if (data.position !== 'admin' ) {
        setError('You do not have admin privileges.');
        return;
      }

      setSuccess('Login successful! Redirecting to the Dashboard...');

      // Store session in localStorage
      localStorage.setItem('userSession', JSON.stringify({ email: data.email, position: data.position }));

      // Redirect to the Dashboard after successful login
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);

    } catch (error) {
      setError('Error: ' + error.message);
    }
  };

  return (
    <div className="container">
 
 <img src={logo} alt="Logo" className="logo-img1" />
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

        <div style={{ position: "relative", display: "inline-block" }}>
      <label htmlFor="password">Password</label>
      <br />
      <input
        type={showPassword ? "text" : "password"}
        id="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        style={{ paddingRight: "30px" }} // Space for the icon
      />
      <span
        onClick={() => setShowPassword(!showPassword)}
        style={{
          position: "absolute",
          right: "20px",
          top: "60%",
          transform: "translateY(-50%)",
          cursor: "pointer",
        }}
      >
        {showPassword ? <FaEyeSlash /> : <FaEye />}
      </span>
    </div>
    <div>

    <button type="submit">Login</button>
    </div>
      
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </div>
  );
};

export default Login;
