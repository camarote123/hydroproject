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
    console.log('Email retrieved from localStorage:', email); // Debugging log

    if (!email) {
      setError('Email address is missing.');
      navigate('/'); // Redirect to the home page or login page if no email found
    }
  }, [navigate]);

  const handlePasswordReset = async (e) => {
    e.preventDefault();

    console.log('Entered password:', password); // Debugging log
    console.log('Entered confirm password:', confirmPassword); // Debugging log

    const email = localStorage.getItem('resetEmail'); // Get the email again when handling the reset

    if (!password || !confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!email) {
      setError('Email address is missing.');
      return;
    }

    try {
      // Hash the new password before storing it in Supabase
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update the password in Supabase (replace 'users' with your table name if different)
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: hashedPassword }) // Update the password field
        .eq('email', email);

      if (updateError) {
        setError('Error updating password: ' + updateError.message);
        return;
      }

      // Redirect to the PasswordChanged page after a successful reset
      setTimeout(() => {
        localStorage.removeItem('resetEmail'); // Clear the stored email
        navigate('/passwordchanged'); // Redirect to the Password Changed page
      }, 2000);

    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  return (
    <div class = 'container'>
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
