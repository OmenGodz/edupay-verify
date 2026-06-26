const express = require("express");
const protect = require("../middleware/protect");
const superAdminOnly = require("../middleware/superAdminOnly");
const cashierOnly = require("../middleware/cashierOnly");
const {
  getAllUsers,
  createUser,
  updateUser,
  deactivateUser,
  searchStudents,
} = require("../controllers/userManagementController");

const router = express.Router();

router.get("/", protect, superAdminOnly, getAllUsers);
router.get("/search", protect, cashierOnly, searchStudents);
router.post("/", protect, superAdminOnly, createUser);
router.patch("/:id", protect, superAdminOnly, updateUser);
router.patch("/:id/deactivate", protect, superAdminOnly, deactivateUser);

module.exports = router;
