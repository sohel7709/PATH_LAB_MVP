import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { testTemplates } from "../../utils/api";
import { TEST_CATEGORIES } from "../../utils/constants";
import { PlusIcon, XMarkIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

const CreateTestTemplate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    sampleType: "",
    category: "",
    description: "",
    fields: [{ parameter: "", unit: "", reference_range: "" }],
  });

  // Generate categories from TEST_CATEGORIES constant
  const categories = [
    { value: "", label: "Select Category" },
    ...Object.entries(TEST_CATEGORIES).map(([key, value]) => ({
      value: value,
      label: key.charAt(0) + key.slice(1).toLowerCase().replace("_", " "),
    })),
  ];

  const sampleTypes = [
    { value: "", label: "Select Sample Type" },
    { value: "blood", label: "Blood" },
    { value: "urine", label: "Urine" },
    { value: "serum", label: "Serum" },
    { value: "plasma", label: "Plasma" },
    { value: "csf", label: "CSF" },
    { value: "stool", label: "Stool" },
    { value: "sputum", label: "Sputum" },
    { value: "swab", label: "Swab" },
    { value: "tissue", label: "Tissue" },
    { value: "other", label: "Other" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFieldChange = (index, e) => {
    const { name, value } = e.target;
    const updatedFields = [...formData.fields];
    updatedFields[index] = {
      ...updatedFields[index],
      [name]: value,
    };

    setFormData({
      ...formData,
      fields: updatedFields,
    });
  };

  const addField = () => {
    setFormData({
      ...formData,
      fields: [...formData.fields, { parameter: "", unit: "", reference_range: "" }],
    });
  };

  const removeField = (index) => {
    const updatedFields = [...formData.fields];
    updatedFields.splice(index, 1);

    setFormData({
      ...formData,
      fields: updatedFields,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.name || !formData.sampleType || !formData.category) {
      setError("Please fill in all required fields");
      return;
    }

    // Validate that at least one field has a parameter
    const hasValidField = formData.fields.some((field) => field.parameter.trim() !== "");
    if (!hasValidField) {
      setError("Please add at least one test parameter");
      return;
    }

    // Filter out empty fields
    const validFields = formData.fields.filter((field) => field.parameter.trim() !== "");

    try {
      setLoading(true);
      setError(null);

      const templateData = {
        ...formData,
        fields: validFields,
      };

      const response = await testTemplates.create(templateData);

      if (response.success) {
        setSuccess("Test template created successfully!");
        setTimeout(() => {
          navigate("/templates");
        }, 2000);
      } else {
        setError(response.message || "Failed to create template");
      }
    } catch (err) {
      console.error("Error creating test template:", err);
      setError("Failed to create test template. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-2">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-blue-700 to-blue-500">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Create Test Template</h1>
              <p className="text-base text-blue-100 mt-1">
                Create a new test template for your lab reports
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/templates")}
              className="inline-flex items-center justify-center rounded-lg border border-transparent bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
            >
              <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Back to Templates
            </button>
          </div>
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

          {/* Template Information */}
          <section>
            <h2 className="text-xl font-semibold text-blue-700 mb-4 border-b border-blue-100 pb-2">
              Template Information
            </h2>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  placeholder="e.g., Liver Function Test"
                  required
                />
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="sampleType" className="block text-sm font-medium text-gray-700 mb-1">
                  Sample Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="sampleType"
                  name="sampleType"
                  value={formData.sampleType}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  required
                >
                  {sampleTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  required
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  placeholder="Brief description of the test template"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Brief description of what this test is used for
                </p>
              </div>
            </div>
          </section>

          {/* Test Parameters */}
          <section>
            <h2 className="text-xl font-semibold text-blue-700 mb-4 border-b border-blue-100 pb-2">
              Test Parameters
            </h2>
            <p className="mt-1 text-sm text-gray-500 mb-4">
              Add parameters that will be included in this test template
            </p>

            <div className="space-y-4">
              {formData.fields.map((field, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-4 rounded-lg border border-blue-100 bg-blue-50/50"
                >
                  <div className="flex-1">
                    <label
                      htmlFor={`parameter-${index}`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Parameter Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id={`parameter-${index}`}
                      name="parameter"
                      value={field.parameter}
                      onChange={(e) => handleFieldChange(index, e)}
                      className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                      placeholder="e.g., SGPT (ALT)"
                    />
                  </div>
                  <div className="w-1/4">
                    <label
                      htmlFor={`unit-${index}`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Unit
                    </label>
                    <input
                      type="text"
                      id={`unit-${index}`}
                      name="unit"
                      value={field.unit}
                      onChange={(e) => handleFieldChange(index, e)}
                      className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                      placeholder="e.g., U/L"
                    />
                  </div>
                  <div className="w-1/3">
                    <label
                      htmlFor={`reference_range-${index}`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Reference Range
                    </label>
                    <input
                      type="text"
                      id={`reference_range-${index}`}
                      name="reference_range"
                      value={field.reference_range}
                      onChange={(e) => handleFieldChange(index, e)}
                      className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                      placeholder="e.g., 7 - 56"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeField(index)}
                      className="mt-6 inline-flex items-center justify-center rounded-lg border border-red-300 bg-white p-2 text-sm font-medium text-red-500 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 transition"
                      title="Remove parameter"
                    >
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="pt-4">
                <button
                  type="button"
                  onClick={addField}
                  className="inline-flex items-center justify-center rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Add Parameter
                </button>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex justify-center space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate("/templates")}
              className="px-6 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold shadow hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-lg border border-transparent bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold shadow hover:from-blue-700 hover:to-blue-600 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {loading ? "Creating..." : "Create Template"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTestTemplate;
