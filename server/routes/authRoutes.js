const express = require("express");

const {
  register,
  login,
} = require("../controllers/authController");

const router = express.Router();

router.get("/test", (req, res) => {
  res.send("Auth Routes Working");
});

router.post("/register", register);
router.post("/login", login);

module.exports = router;
