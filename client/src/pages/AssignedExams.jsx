import { useCallback, useEffect, useState } from "react";
import { getAssignedExams } from "../api/examApi";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";
import EmptyState from "../components/ui/EmptyState";
import Skeleton from "../components/ui/Skeleton";
import { IconInbox } from "../components/icons/Icons";

const FILTERS = ["All", "Scheduled", "In Progress", "Completed"];

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const AssignedExams = () => {
  const { showToast } = useToast();

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [error, setError] = useState("");

  const fetchExams = useCallback(async () => {
    try {
      const data = await getAssignedExams();
      setExams(data);
      setError("");
    } catch {
      setError("Could not load assigned exams.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const filtered =
    filter === "All"
      ? exams
      : exams.filter((e) => e.status === filter);

  return (
    <div>
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={[
              "rounded-lg min-h-11 px-4 py-2.5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-sti-blue/20",
              filter === f
                ? "bg-sti-blue text-white shadow-[0_4px_14px_rgba(0,61,165,0.35)]"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
            ].join(" ")}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid gap-6">
        {loading ? (
          <div className="rounded-xl border border-gray-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
            <Skeleton variant="card" count={3} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={IconInbox}
            title="No exams assigned"
            description={`No ${filter === "All" ? "" : filter.toLowerCase() + " "}exams assigned yet.`}
          />
        ) : (
          filtered.map((exam) => (
            <div
              key={exam._id}
              className="rounded-xl border border-gray-100 bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-800">
                      {exam.subject}
                    </h3>
                    <span className="inline-block bg-sti-blue text-white text-xs font-bold px-3 py-1 rounded-full">
                      {exam.examType}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Code: <span className="font-semibold">{exam.subjectCode}</span>
                  </p>

                  <div className="grid gap-2 grid-cols-2 md:grid-cols-4 text-sm">
                    <div>
                      <span className="font-semibold text-gray-700">Date</span>
                      <p className="text-gray-600">{formatDate(exam.examDate)}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Schedule</span>
                      <p className="text-gray-600">{exam.schedule}</p>
                    </div>
                    {exam.room && (
                      <div>
                        <span className="font-semibold text-gray-700">Room</span>
                        <p className="text-gray-600">{exam.room}</p>
                      </div>
                    )}
                    {exam.capacity && (
                      <div>
                        <span className="font-semibold text-gray-700">Capacity</span>
                        <p className="text-gray-600">{exam.capacity} students</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <StatusBadge status={exam.status} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AssignedExams;
