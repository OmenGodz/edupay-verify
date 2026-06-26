const statusStyles = {
  Pending: "bg-amber-100 text-amber-800",
  Approved: "bg-emerald-100 text-emerald-800",
  Rejected: "bg-red-100 text-red-700",
  "Need Review": "bg-amber-100 text-amber-800",
  Submitted: "bg-blue-100 text-blue-800",
  "In Progress": "bg-green-100 text-green-800",
  Completed: "bg-green-100 text-green-700 border border-green-200",
  Closed: "bg-gray-100 text-gray-600",
  Scheduled: "bg-blue-100 text-blue-800",
  Cancelled: "bg-gray-100 text-gray-600",
  Reopened: "bg-purple-100 text-purple-800",
};

const StatusBadge = ({ status, onClick }) => (
  <span
    onClick={onClick}
    className={[
      "inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm transition",
      statusStyles[status] ?? "bg-gray-100 text-gray-600",
      onClick ? "cursor-pointer hover:opacity-80" : ""
    ].join(" ")}
  >
    {status ?? "Unknown"}
  </span>
);

export default StatusBadge;
