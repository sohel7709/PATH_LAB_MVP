import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { superAdmin } from "../../utils/api";

const CreateUser = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin",
    lab: "",
  });

  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fetchingLabs, setFetchingLabs] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Fetch available labs
  useEffect(() => {
    const fetchLabs = async () => {
      try {
        setFetchingLabs(true);
        const response = await superAdmin.getLabs();
        if (response.success) {
          setLabs(response.data || []);
        }
      } catch (err) {
        console.error("Error fetching labs:", err);
      } finally {
        setFetchingLabs(false);
      }
    };

    fetchLabs();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validate form data
      if (formData.role !== "super-admin" && !formData.lab) {
        throw new Error("Please select a lab for this user");
      }

      // Prepare the user data with the correct field name for lab ID
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        // Use labId instead of lab for the API
        labId: formData.role !== "super-admin" ? formData.lab : undefined,
      };

      console.log("Creating user with data:", userData);
      await superAdmin.createUser(userData);

      setSuccess("User created successfully!");
      setTimeout(() => {
        navigate("/users");
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-2">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-blue-700 to-blue-500">
          <h1 className="text-3xl font-extrabold text-white">Create New User</h1>
          <p className="text-base text-blue-100 mt-1">Add a new user to the system</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded mb-4">
              <p className="font-medium">Success:</p>
              <p>{success}</p>
            </div>
          )}

          {/* User Information */}
          <section>
            <h2 className="text-xl font-semibold text-blue-700 mb-4 border-b border-blue-100 pb-2">
              User Information
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  placeholder="Enter email address"
                />
              </div>

              <div className="relative">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-lg border border-blue-300 px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute top-9 right-3 transform -translate-y-1/2 p-1 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    // Eye-off SVG
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4.03-9-9 0-1.657.403-3.22 1.125-4.575m2.122-2.122A8.963 8.963 0 0112 3c5 0 9 4.03 9 9 0 1.657-.403 3.22-1.125 4.575m-2.122 2.122A8.963 8.963 0 0112 21c-1.657 0-3.22-.403-4.575-1.125m-2.122-2.122A8.963 8.963 0 013 12c0-1.657.403-3.22 1.125-4.575m2.122-2.122L21 21" />
                    </svg>
                  ) : (
                    // Eye SVG
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
                <p className="mt-1 text-xs text-gray-500">Password must be at least 6 characters long</p>
              </div>
            </div>
          </section>

          {/* Role & Lab Assignment */}
          <section>
            <h2 className="text-xl font-semibold text-blue-700 mb-4 border-b border-blue-100 pb-2">
              Role & Lab Assignment
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  User Role <span className="text-red-500">*</span>
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                >
                  <option value="admin">Lab Admin</option>
                  <option value="technician">Lab Technician</option>
                  <option value="super-admin">Super Admin</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {formData.role === "admin"
                    ? "Admins can manage lab settings and users"
                    : formData.role === "technician"
                    ? "Technicians can create and manage reports"
                    : "Super Admins have full system access"}
                </p>
              </div>

              {formData.role !== "super-admin" && (
                <div>
                  <label htmlFor="lab" className="block text-sm font-medium text-gray-700 mb-1">
                    Assign to Lab <span className="text-red-500">*</span>
                  </label>
                  {fetchingLabs ? (
                    <div className="mt-1 block w-full h-10 flex items-center justify-center">
                      <div className="animate-pulse flex space-x-2">
                        <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                        <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                        <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                      </div>
                      <p className="ml-2 text-sm text-gray-500">Loading labs...</p>
                    </div>
                  ) : (
                    <select
                      id="lab"
                      name="lab"
                      value={formData.lab}
                      onChange={handleChange}
                      required={formData.role !== "super-admin"}
                      className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                    >
                      <option value="">Select a lab</option>
                      {labs.map((lab) => (
                        <option key={lab._id} value={lab._id}>
                          {lab.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.role === "admin" 
                      ? "The lab this admin will manage" 
                      : "The lab this technician will work in"}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Actions */}
          <div className="flex justify-center space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate("/users")}
              className="px-6 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold shadow hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-lg border border-transparent bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold shadow hover:from-blue-700 hover:to-blue-600 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {loading ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUser;
