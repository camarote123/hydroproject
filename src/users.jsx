import bcrypt from "bcryptjs";
import emailjs from "emailjs-com";
import React, { useEffect, useState } from "react";
import { FaEdit, FaTrashAlt } from 'react-icons/fa';

import { supabase } from "./createClient";
import Navbar from './navbar';
import "./users.css";

// Function to generate a random password
function generateRandomPassword(length = 8) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return password;
}

const Users = () => {
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState({ name: "", email: "", position: "", password: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteUserId, setDeleteUserId] = useState(null);

  const protectedEmail = "emmancamarote02@gmail.com";

  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch users from Supabase
  async function fetchUsers() {
    setLoading(true);
    const { data, error } = await supabase.from("users").select("*").order("id", { ascending: true });
    if (error) {
      console.error("Error fetching users:", error.message);
    } else {
      setUsers(data);
    }
    setLoading(false);
  }

  // Handle form input changes
  function handleChange(event) {
    setUser((prevFormData) => ({
      ...prevFormData,
      [event.target.name]: event.target.value,
    }));
  }

  // Generate password when the user clicks the "Generate Password" button
  function handleGeneratePassword() {
    const generatedPassword = generateRandomPassword();
    setUser((prevState) => ({
      ...prevState,
      password: generatedPassword,
    }));
  }

  // Validate email format
  function validateEmail(email) {
    const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  }

  // Create a new user and send an email with their details
  async function createUser(event) {
    event.preventDefault();
    const { name, email, position, password } = user;

    if (!name || !email || !position || !password) {
      alert("Please fill in all fields");
      return;
    }

    if (!validateEmail(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Hash the password before saving it to Supabase
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into Supabase with the hashed password
      const { error } = await supabase
        .from("users")
        .insert([{ name, email, position, password: hashedPassword }]);

      if (error) {
        setError("Error creating user: " + error.message);
        setLoading(false);
        return;
      }

      // Define the local link to include in the email
     

      // Send email using EmailJS to the new user
      const emailParams = {
        name,
        email,
        password,
        position,
    
      };

      emailjs
        .send(
          "service_cnx0pcx",
          "template_uw9frtx",
          emailParams,
          "HLKtzdj8WdjaQRRuh"
        )
        .then(
          (response) => {
            console.log("Email sent successfully!", response.status, response.text);
            alert("User created and email sent successfully.");
          },
          (err) => {
            console.error("Failed to send email:", err);
            setError("Failed to send email. Please try again.");
          }
        );

      resetModal();
      fetchUsers();
    } catch (err) {
      setError("Error creating user: " + err.message);
    }

    setLoading(false);
  }

  // Update an existing user
  async function updateUser(event) {
    event.preventDefault();
    const { name, email, position } = user;

    if (!name || !email || !position) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    const { error } = await supabase
      .from("users")
      .update({ name, email, position })
      .eq("id", editingUserId);

    if (error) {
      setError("Error updating user: " + error.message);
      setLoading(false);
      return;
    }

    resetModal();
    fetchUsers();
    setLoading(false);
  }

  // Delete a user
  async function deleteUser(userId) {
    const userToDelete = users.find((u) => u.id === userId);

    if (userToDelete && userToDelete.email === protectedEmail) {
      alert("You cannot delete this user as their email is protected.");
      setDeleteUserId(null);
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("users").delete().eq("id", userId);

    if (error) {
      setError("Error deleting user: " + error.message);
    } else {
      fetchUsers();
    }
    setLoading(false);
    setDeleteUserId(null);
  }

  // Open the modal for editing an existing user
  function openEditModal(user) {
    setUser(user);
    setEditingUserId(user.id);
    setIsEdit(true);
    setIsModalOpen(true);
  }

  // Open delete confirmation modal
  function openDeleteConfirmation(userId) {
    setDeleteUserId(userId);
  }

  // Reset the modal state
  function resetModal() {
    setUser({ name: "", email: "", position: "", password: "" });
    setIsModalOpen(false);
    setIsEdit(false);
    setEditingUserId(null);
  }

  return (
    <div className="container">
      <Navbar />
      <h1>User Management</h1>

      {/* Create User Button */}
      <button 
        onClick={() => { resetModal(); setIsModalOpen(true); }}
        className="create-user-btn"
      >
        Create User
      </button>

      {isModalOpen && (
  <div className="modal">
    <div className="modal-content">
      {/* Close Button */}
      <button className="modal-close" onClick={resetModal}>
        &times;
      </button>
      

      <h2>{isEdit ? "Edit User" : "Create User"}</h2>
      <form onSubmit={isEdit ? updateUser : createUser}>
        <div className="input-group">
          <input
            type="text"
            placeholder="Name"
            name="name"
            value={user.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-group">
          <input
            type="email"
            placeholder="Email"
            name="email"
            value={user.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-group">
          <select name="position" value={user.position} onChange={handleChange}>
            <option value="">Select Position</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
          </select>
        </div>

        {!isEdit && (
          <div className="password-group">
            <input
              type={passwordVisible ? "text" : "password"}
              placeholder="Password"
              name="password"
              value={user.password}
              onChange={handleChange}
            />
            <button
              type="button"
              className="generate-password-btn"
              onClick={handleGeneratePassword}
            >
              Generate Password
            </button>
          </div>
        )}

        <div className="button-group">
          
          <button type="submit" className="create-btn" disabled={loading}>
            {isEdit ? "Update" : "Create"}
          </button>
        </div>
      </form>
      {error && <p className="error-message">{error}</p>}
    </div>
  </div>
)}


      {/* Delete Confirmation Modal */}
      {deleteUserId && (
        <div className="modal">
          <div className="modal-content-delete">
            <h3>Are you sure you want to delete this user?</h3>
            <div className="button-group">
              <button onClick={() => setDeleteUserId(null)}>No</button>
              <button onClick={() => deleteUser(deleteUserId)}>Yes</button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Position</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.position}</td>
              <td className="action-buttons">
                <button onClick={() => openEditModal(user)}><FaEdit /></button>
                <button onClick={() => openDeleteConfirmation(user.id)}><FaTrashAlt /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Users;