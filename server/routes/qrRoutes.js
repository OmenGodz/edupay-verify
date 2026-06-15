const express = require("express");
const router = express.Router();
const protect = require("../middleware/protect");
const teacherOnly = require("../middleware/teacherOnly");

const {
  generateQR,
  getStudentPermits,
  scanPermit,
  decidePermit,
} = require("../controllers/qrController");

router.get("/student/:studentId", protect, getStudentPermits);
router.post("/generate", protect, generateQR);
router.post("/scan", protect, teacherOnly, scanPermit);
router.put("/:id/proctor-decision", protect, teacherOnly, decidePermit);

module.exports = router;
