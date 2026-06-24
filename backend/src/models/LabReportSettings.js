const mongoose = require("mongoose");

const labReportSettingsSchema = new mongoose.Schema(
  {
    lab: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lab",
      required: true,
      unique: true,
    },
    header: {
      headerMode: {
        type: String,
        enum: ["generated", "image", "none"],
        default: "generated",
      },
      headerDesign: {
        type: String,
        enum: ["classic", "centered", "modern", "minimal"],
        default: "classic",
      },
      tagline: {
        type: String,
        default: "",
      },

      website: {
        type: String,
        default: "",
      },

      registrationNo: {
        type: String,
        default: "",
      },

      technicianName: {
        type: String,
        default: "",
      },
      labName: {
        type: String,
        required: [true, "Lab name is required"],
      },
      doctorName: {
        type: String,
        required: [true, "Doctor name is required"],
      },
      address: {
        type: String,
        required: [true, "Address is required"],
      },
      phone: {
        type: String,
      },
      email: {
        type: String,
      },
      logo: {
        type: String, // URL to the logo image
        default: "",
      },
    },
    footer: {
      footerMode: {
        type: String,
        enum: ["generated", "image", "none"],
        default: "generated",
      },
      verifiedBy: {
        type: String,
        required: [true, "Verified by name is required"],
      },
      designation: {
        type: String,
        default: "Consultant Pathologist",
      },
      signature: {
        type: String, // URL to the signature image
        default: "",
      },
      signatureType: {
        type: String, // MIME type of the signature image (image/png, image/jpeg)
        default: "",
      },
      footerImage: {
        type: String, // URL to the footer image
        default: "",
      },
      footerImageType: {
        type: String, // MIME type of the footer image (image/png, image/jpeg)
        default: "",
      },
    },
    styling: {
      primaryColor: {
        type: String,
        default: "#3b82f6", // Blue color
      },
      secondaryColor: {
        type: String,
        default: "#1e40af", // Darker blue
      },
      fontFamily: {
        type: String,
        default: "Arial, sans-serif",
      },
      fontSize: {
        type: Number,
        default: 12,
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("LabReportSettings", labReportSettingsSchema);
