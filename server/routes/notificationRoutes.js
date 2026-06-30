const express = require("express");
const protect = require("../middleware/protect");
const {
    getMyNotifications,
    markMyNotificationsRead,
} = require("../controllers/notificationController");

const router = express.Router();

router.use(protect);

router.get("/", getMyNotifications);
router.patch("/read", markMyNotificationsRead);

module.exports = router;