import React from "react";

export default function TestNotesSection({ notes, handleChange, label = "Additional Notes" }) { // Add label prop with default
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-blue-700 mb-4 border-b border-blue-100 pb-2">
        {label} {/* Use the label prop for the title */}
      </h2>
      <div className="mt-4">
        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={notes}
          onChange={handleChange}
          className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
          placeholder="Add any additional notes or observations here..."
        />
      </div>
    </section>
  );
}
