const extractText =
require("../services/ocrService");

const Payment =
  require("../Models/Payments");

const ExamPermit =
  require("../Models/ExamPermit");

const User =
  require("../Models/User");

  const Notification =
require(
"../Models/Notification"
);

  const Ledger =
require("../Models/Ledger");

const createPayment =
async (req, res) => {

  try {

    const account =
      await User.findById(req.user.id);

    if (!account || account.role !== "student") {
      return res.status(403).json({
        message: "Only students can submit receipts.",
      });
    }

    const text =
        await extractText(
        req.file.path
        );

       


console.log(text);

const invoiceMatch =
text.match(
/INVOICE\s*NO[: ]+(\d+)/i
);

const invoiceNumber =
invoiceMatch
? invoiceMatch[1]
: "";

console.log(
  "Invoice:",
  invoiceNumber
);

const studentMatch =
text.match(
/STUDENT\s*ID[: ]+([0-9\-]+)/i
);

const extractedStudentId =
studentMatch
? studentMatch[1]
: "";

if (extractedStudentId && extractedStudentId !== account.studentId) {
  return res.status(400).json({
    message: "Receipt student ID does not match your account.",
  });
}

const studentId =
account.studentId || req.body.studentId || "";

console.log(
  "Student:",
  studentId
);

const amountMatch =
text.match(
/AMOUNT[: ]+([\d,.]+)/i
);

const amount =
amountMatch
? amountMatch[1]
: "";

console.log(
  "Amount:",
  amount
);

const dateMatch =
text.match(
/DATE[: ]+([0-9\/\-]+)/i
);

const paymentDate =
dateMatch
? dateMatch[1]
: "";

console.log(
  "Date:",
  paymentDate
);


    const payment =
await Payment.create({

  studentId:
  studentId,

  studentName:
  account.name || req.body.studentName,

  invoiceNumber:
  invoiceNumber,

  amount:
  amount,

  paymentDescription:
  req.body.paymentDescription,

  examCoverage:
  req.body.examCoverage,

  receiptImage:
  req.file.path,

  paymentDate:
  paymentDate,

  status:
  "Pending",

});

    // Notify cashiers about new receipt submission
    await Notification.create({
      studentId: studentId,
      studentName: account.name || req.body.studentName,
      recipientRole: "cashier",
      title: "New Receipt Submitted",
      message: `${account.name || req.body.studentName} (${studentId}) submitted a receipt for ${req.body.paymentDescription || "payment"}.`,
    });

    res.status(201).json(
      payment
    );

  } catch (error) {

    res.status(500).json({
      message:
      error.message,
    });

  }

};
const getPayments =
  async (req, res) => {
    try {

      const query = {};

      if (req.user.role === "student") {
        const account =
          await User.findById(req.user.id);
        query.studentId = account?.studentId;
      } else if (!["cashier", "super_admin"].includes(req.user.role)) {
        return res.status(403).json({
          message: "Access Denied",
        });
      }

      const payments =
        await Payment.find(query);

      res.json(payments);

    } catch (error) {

      res.status(500).json({
        message:
          error.message,
      });

    }
  };

const approvePayment =
async (req, res) => {

  try {

    const payment =
      await Payment.findById(
        req.params.id
      );

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    payment.status =
      "Approved";

    await Notification.create({
      studentId: payment.studentId,
      title: "Payment Approved",
      message: "Your payment has been approved.",
    });

    await payment.save();

    let ledger =
      await Ledger.findOne({
        studentId:
        payment.studentId,
      });

    if (!ledger) {

      ledger =
      await Ledger.create({
        studentId:
        payment.studentId,
      });

    }

    ledger.paidAmount +=
      Number(payment.amount) || 0;

    ledger.remainingBalance =
      ledger.totalTuition -
      ledger.paidAmount;

    if (
      ledger.remainingBalance <= 0
    ) {

      ledger.fullyPaid =
      true;

      ledger.prelim = true;
      ledger.midterm = true;
      ledger.preFinal = true;
      ledger.final = true;

    }

    if (payment.examCoverage) {
      const coverageMap = {
        Prelim: "prelim",
        Midterm: "midterm",
        PreFinal: "preFinal",
        Final: "final",
      };

      const ledgerField = coverageMap[payment.examCoverage];
      if (ledgerField) {
        ledger[ledgerField] = true;
      }

      const crypto = require("crypto");
      await ExamPermit.findOneAndUpdate(
        {
          studentId: payment.studentId,
          examType: payment.examCoverage,
        },
        {
          $set: {
            studentName: payment.studentName,
            paymentId: payment._id,
            permitStatus: "Valid",
          },
          $setOnInsert: {
            qrToken: crypto.randomBytes(24).toString("hex"),
            proctorDecision: "Pending",
          },
        },
        {
          upsert: true,
          new: true,
        }
      );
    }

    await ledger.save();

    res.json({
      message:
      "Approved",
    });

  } catch (error) {

    res.status(500).json({
      message:
      error.message,
    });

  }
};

const rejectPayment =
async (req, res) => {

  try {

    const payment =
      await Payment.findById(
        req.params.id
      );

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    payment.status = "Rejected";

    await Notification.create({
      studentId: payment.studentId,
      title: "Payment Rejected",
      message: "Please upload a clearer receipt.",
    });

    await payment.save();

    res.json({
      message: "Rejected",
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

};

module.exports = {
  createPayment,
  getPayments,
  approvePayment,
  rejectPayment,
};
