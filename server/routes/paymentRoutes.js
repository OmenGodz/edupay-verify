const express =
  require("express");

const {
  createPayment,
  getPayments,
  approvePayment,
  rejectPayment,
} = require(
  "../controllers/paymentController"
);

const protect =
require(
"../middleware/protect"
);

const cashierOnly =
require(
"../middleware/cashierOnly"
);

const upload =
require(
"../middleware/upload"
);

const router =
  express.Router();

router.post(
"/",
protect,
upload.single("receipt"),
createPayment
);

router.get(
  "/",
  protect,
  getPayments
);

router.put(
"/approve/:id",

protect,

cashierOnly,

approvePayment

);

router.put(
"/reject/:id",

protect,

cashierOnly,

rejectPayment

);

module.exports =
  router;
