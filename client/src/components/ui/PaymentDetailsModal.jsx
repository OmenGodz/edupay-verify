import Modal from "./Modal";
import StatusBadge from "./StatusBadge";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const PaymentDetailsModal = ({ isOpen, onClose, payment }) => {
  if (!payment) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Payment Details">
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Status</p>
          <StatusBadge status={payment.status} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm col-span-2">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
              Description / Invoice
            </label>
            <p className="text-sm font-semibold text-gray-800">
              {payment.invoiceNumber ? `Invoice #${payment.invoiceNumber}` : payment.paymentDescription || "Payment"}
            </p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Amount</label>
            <p className="text-sm font-semibold text-gray-800">
              {payment.amount ? `₱${payment.amount}` : "—"}
            </p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Term Coverage</label>
            <p className="text-sm font-semibold text-gray-800">
              {payment.examCoverage || "—"}
            </p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm col-span-2">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Date Submitted</label>
            <p className="text-sm font-semibold text-gray-800">
              {formatDate(payment.createdAt)}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentDetailsModal;
