import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

const EditUser = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'technician',
    labId: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/users/${id}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch user');
        }

        setFormData({
          name: data.data.name,
          email: data.data.email,
          role: data.data.role,
          labId: data.data.lab || ''
        });
      } catch (err) {
        setError(err.message);
      }
    };

    fetchUser();
  }, [id, user.token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`http://localhost:5000/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user');
      }

      navigate('/users'); // Redirect to user list after successful update
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1>Edit User</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="New Password (leave blank to keep current)"
          value={formData.password}
          onChange={handleChange}
        />
        <select name="role" value={formData.role} onChange={handleChange}>
          <option value="technician">Technician</option>
          <option value="admin">Admin</option>
          <option value="super-admin">Super Admin</option>
        </select>
        <input
          type="text"
          name="labId"
          placeholder="Lab ID (if applicable)"
          value={formData.labId}
          onChange={handleChange}
        />
        <button type="submit">Update User</button>
      </form>
    </div>
  );
};

export default EditUser;
