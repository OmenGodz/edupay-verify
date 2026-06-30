const QRCode =
require("qrcode");

const ExamPermit =
require("../Models/ExamPermit");

const User =
require("../Models/User");

const generateQR =
async (req, res) => {

  try {
    const {
      studentId,
      examType,
    } = req.body;

    if (req.user.role !== "student") {
      return res.status(403).json({
        message: "Access Denied",
      });
    }

    const account =
      await User.findById(req.user.id).select("studentId");

    if (!account || account.studentId !== studentId) {
      return res.status(403).json({
        message: "Access Denied",
      });
    }

    const permit =
      await ExamPermit.findOne({
        studentId,
        examType,
        permitStatus: "Valid",
      });

    if (!permit) {
      return res.status(404).json({
        message: "No valid exam permit found.",
      });
    }

    const qrData =
      JSON.stringify({
        permitId: permit._id,
        token: permit.qrToken,
      });

    const qr =
      await QRCode.toDataURL(
        qrData
      );

    res.json({
      qr,
      permit,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getStudentPermits =
async (req, res) => {
  try {
    if (!["student", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Access Denied",
      });
    }

    if (req.user.role === "student") {
      const account =
        await User.findById(req.user.id).select("studentId");

      if (!account || account.studentId !== req.params.studentId) {
        return res.status(403).json({
          message: "Access Denied",
        });
      }
    }

    const permits =
      await ExamPermit.find({
        studentId: req.params.studentId,
        permitStatus: "Valid",
      }).sort({ createdAt: -1 });

    res.json(permits);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const scanPermit =
async (req, res) => {
  try {
    const {
      token,
    } = req.body;

    const permit =
      await ExamPermit.findOne({
        qrToken: token,
        permitStatus: "Valid",
      });

    if (!permit) {
      return res.status(404).json({
        message: "Invalid or revoked exam permit.",
      });
    }

    const teacher =
      await User.findById(req.user.id).select("name studentId");

    permit.scans.push({
      teacherId: req.user.id,
      teacherName: teacher?.name || "Teacher",
      action: "Scanned",
    });

    await permit.save();

    res.json(permit);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const decidePermit =
async (req, res) => {
  try {
    const {
      decision,
      remarks,
    } = req.body;

    if (!["Approved", "Rejected"].includes(decision)) {
      return res.status(400).json({
        message: "Decision must be Approved or Rejected.",
      });
    }

    const permit =
      await ExamPermit.findById(req.params.id);

    if (!permit || permit.permitStatus !== "Valid") {
      return res.status(404).json({
        message: "Valid exam permit not found.",
      });
    }

    const teacher =
      await User.findById(req.user.id).select("name studentId");

    permit.proctorDecision = decision;
    permit.proctorRemarks = remarks || "";
    permit.proctorTeacherId = req.user.id;
    permit.proctorTeacherName = teacher?.name || "Teacher";
    permit.proctorDecidedAt = new Date();
    permit.scans.push({
      teacherId: req.user.id,
      teacherName: teacher?.name || "Teacher",
      action: decision,
      remarks: remarks || "",
    });

    await permit.save();

    // Notify the student about the proctor's decision
    const Notification = require("../Models/Notification");
    const student = await User.findOne({ studentId: permit.studentId });

    const isApproved = decision === "Approved";
    const remarksText = remarks ? ` Remarks: ${remarks}` : "";
    await Notification.create({
      studentId: permit.studentId,
      studentName: student?.name || permit.studentName,
      recipientRole: "student",
      title: isApproved ? "Exam Permit Approved" : "Exam Permit Rejected",
      message: isApproved
        ? `Your ${permit.examType} exam permit has been approved by ${teacher?.name || "a proctor"}.${remarksText}`
        : `Your ${permit.examType} exam permit has been rejected by ${teacher?.name || "a proctor"}.${remarksText}`,
    });

    res.json(permit);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  generateQR,
  getStudentPermits,
  scanPermit,
  decidePermit,
};
