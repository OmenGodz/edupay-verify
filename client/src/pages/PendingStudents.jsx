import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getPendingStudents,
  verifyStudent,
  rejectStudent,
} from "../api/userManagementApi";
import { useToast } from "../context/ToastContext";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import Drawer from "../components/ui/Drawer";
import {
  IconUsers,
  IconSearch,
  IconLoader,
  IconCheckCircle,
  IconXCircle,
  IconAlertCircle,
  IconClock,
} from "../components/icons/Icons";

const PendingStudents = () => {
  const { showToast } = useToast();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  // Rejection drawer state
  const [rejectDrawerOpen, setRejectDrawerOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  const fetchPending = useCallback(async () => {
    try {
      const data = await getPendingStudents();
      setStudents(data);
      setError("");
    } catch {
      setError("Could not load pending students.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const filtered = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.studentId || "").toLowerCase().includes(q)
    );
  }, [students, search]);

  const handleVerify = async (student) => {
    if (
      !window.confirm(
        `Approve ${student.name} (${student.studentId})? They will be able to log in.`
      )
    )
      return;

    setActionLoading(student._id);
    try {
      await verifyStudent(student._id);
      showToast(`${student.name} has been verified.`, "success");
      await fetchPending();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to verify student.",
        "error"
      );
    } finally {
      setActionLoading("");
    }
  };

  const openRejectDrawer = (student) => {
    setRejectTarget(student);
    setRejectionReason("");
    setRejectDrawerOpen(true);
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectTarget) return;

    setRejectLoading(true);
    try {
      await rejectStudent(rejectTarget._id, rejectionReason);
      showToast(`${rejectTarget.name} has been rejected.`, "info");
      setRejectDrawerOpen(false);
      setRejectTarget(null);
      await fetchPending();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to reject student.",
        "error"
      );
    } finally {
      setRejectLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const rejectFooter = (
    <div className="flex justify-end gap-3">
      <button
        type="button"
        onClick={() => setRejectDrawerOpen(false)}
        disabled={rejectLoading}
        className="min-h-11 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleReject}
        disabled={rejectLoading}
        className="flex min-h-11 items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-70"
      >
        {rejectLoading ? <IconLoader className="h-4 w-4" /> : null}
        Reject Student
      </button>
    </div>
  );

  return (
    <div>
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Header stats */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <IconClock className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">
            {loading ? "..." : students.length} Pending
          </p>
          <p className="text-xs text-gray-500">
            Student registrations awaiting verification
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <IconSearch className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-11 w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-4 text-sm font-medium text-gray-700 shadow-sm outline-none transition focus:border-sti-gold focus:ring-2 focus:ring-sti-gold/20"
            aria-label="Search pending students"
          />
        </div>
      </div>

      {/* Students table */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {[
                  "Name",
                  "Email",
                  "Student ID",
                  "Course",
                  "Year",
                  "Registered",
                  "Actions",
                ].map((col) => (
                  <th
                    key={col}
                    className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <Skeleton variant="table-row" count={3} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={IconUsers}
                      title="No pending students"
                      description={
                        search.trim()
                          ? "No pending students match your search."
                          : "All student registrations have been processed."
                      }
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((student) => (
                  <tr
                    key={student._id}
                    className="group transition-colors hover:bg-blue-50/30"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600">
                        {student.name}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {student.email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {student.studentId || "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {student.course || "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {student.yearLevel || "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {formatDate(student.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleVerify(student)}
                          disabled={actionLoading === student._id}
                          className="inline-flex min-h-11 items-center gap-1 rounded-md bg-green-50 px-3 py-2.5 text-xs font-bold text-green-700 transition hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500/20 disabled:opacity-60"
                          aria-label={`Approve ${student.name}`}
                        >
                          {actionLoading === student._id ? (
                            <IconLoader className="h-3.5 w-3.5" />
                          ) : (
                            <IconCheckCircle className="h-3.5 w-3.5" />
                          )}
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => openRejectDrawer(student)}
                          disabled={actionLoading === student._id}
                          className="inline-flex min-h-11 items-center gap-1 rounded-md bg-red-50 px-3 py-2.5 text-xs font-bold text-red-500 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-60"
                          aria-label={`Reject ${student.name}`}
                        >
                          <IconXCircle className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer summary */}
        {!loading && filtered.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-3">
            <p className="text-xs font-semibold text-gray-400">
              Showing {filtered.length} pending student
              {filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>

      {/* Rejection Reason Drawer */}
      <Drawer
        open={rejectDrawerOpen}
        onClose={() => !rejectLoading && setRejectDrawerOpen(false)}
        title={`Reject ${rejectTarget?.name || "Student"}`}
        footer={rejectFooter}
      >
        <form onSubmit={handleReject} className="space-y-5">
          {rejectTarget && (
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <p className="text-sm font-bold text-gray-800">
                {rejectTarget.name}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                {rejectTarget.studentId} &middot; {rejectTarget.email}
              </p>
            </div>
          )}

          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <IconAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              This student will not be able to log in. They will be notified of
              the rejection.
            </span>
          </div>

          <div>
            <label
              htmlFor="rejection-reason"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Reason for Rejection{" "}
              <span className="text-xs text-gray-400">(optional)</span>
            </label>
            <textarea
              id="rejection-reason"
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              disabled={rejectLoading}
              placeholder="e.g. Student ID not found in enrollment records..."
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-sti-gold focus:ring-2 focus:ring-sti-gold/20 disabled:opacity-60"
            />
          </div>
        </form>
      </Drawer>
    </div>
  );
};

export default PendingStudents;
