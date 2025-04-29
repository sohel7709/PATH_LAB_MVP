import React, { useState, useRef, useEffect } from "react";

export default function TestTemplateSelector({ 
  selectedTemplates, 
  availableTemplates, 
  handleTemplateSelect 
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef(null);

  // Handler for adding a template to selection
  const addTemplate = (templateId) => {
    console.log("Adding template:", templateId);
    if (!selectedTemplates.includes(templateId)) {
      handleTemplateSelect([...selectedTemplates, templateId]);
      setSearchQuery("");
      setShowDropdown(false);
    }
  };

  // Handler for removing a template from selection
  const removeTemplate = (templateId) => {
    console.log("Removing template:", templateId);
    handleTemplateSelect(selectedTemplates.filter(id => id !== templateId));
  };

  // Filter templates based on search query (case-insensitive)
  const filteredTemplates = availableTemplates.filter(template => {
    const name = (template.templateName || template.name || "").toLowerCase();
    const shortName = (template.shortName || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || shortName.includes(query);
  }).filter(template => !selectedTemplates.includes(template._id));

  // Helper to get template display name by id
  const getTemplateName = (id) => {
    if (id === "custom") return "Custom Test";
    const template = availableTemplates.find(t => t._id === id);
    if (!template) return id;
    return `${template.templateName || template.name} (${template.shortName})`;
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <section className="mb-8" ref={containerRef}>
      <h2 className="text-xl font-semibold text-blue-700 mb-4 border-b border-blue-100 pb-2">
        Test Template
      </h2>
      <label htmlFor="templateSearch" className="block text-sm font-medium text-gray-700 mb-1">
        Search and Select Test Templates
      </label>
      <div className="relative">
        <input
          type="text"
          id="templateSearch"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Type to search templates..."
          className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
          autoComplete="off"
        />
        {showDropdown && filteredTemplates.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm border border-blue-200">
            {filteredTemplates.map(template => (
              <li
                key={template._id}
                className="cursor-pointer select-none relative py-2 pl-3 pr-9 text-gray-900 hover:bg-blue-50"
                onClick={() => addTemplate(template._id)}
              >
                {template.templateName || template.name} ({template.shortName})
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {selectedTemplates.length > 0 ? (
          selectedTemplates.map(id => (
            <div
              key={id}
              className="flex items-center bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm"
            >
              <span>{getTemplateName(id)}</span>
              <button
                type="button"
                onClick={() => removeTemplate(id)}
                className="ml-2 text-blue-600 hover:text-blue-900 font-bold"
                aria-label={`Remove ${getTemplateName(id)}`}
              >
                &times;
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">No templates selected.</p>
        )}
      </div>
    </section>
  );
}
