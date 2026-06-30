const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: [
        "student",
        "cashier",
        "admin",
        "teacher",
        "super_admin",
      ],
      default: "student",
    },

    course: String,

    yearLevel: Number,

    semester: String,

    schoolYear: String,

    isActive: {
      type: Boolean,
      default: true,
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "verified",
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    verifiedAt: {
      type: Date,
      required: false,
    },

    rejectionReason: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.model("User", userSchema);