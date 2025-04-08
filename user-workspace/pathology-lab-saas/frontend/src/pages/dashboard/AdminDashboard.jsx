import React from 'react';

const AdminDashboard = () => {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Full control over lab-specific operations</p>
      <h2>Manage Technicians</h2>
      <button>Add Technician</button>
      <button>Edit Technician</button>
      <button>Delete Technician</button>
      <h2>Manage Reports</h2>
      <button>View Reports</button>
      <button>Edit Reports</button>
      <button>Delete Reports</button>
      <h2>Manage Patients</h2>
      <button>View Patients</button>
      <button>Edit Patient Records</button>
      <h2>Financial Reports</h2>
      <button>Generate Financial Reports</button>
      <h2>Inventory Management</h2>
      <button>Oversee Inventory</button>
    </div>
  );
};

export default AdminDashboard;
