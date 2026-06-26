import { useCallback, useEffect, useState } from "react";
import { getExamScheduleReport } from "../api/examApi";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/ui/PageHeader";
import { IconLoader, IconFile } from "../components/icons/Icons";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const EXAM_TYPES = ["Prelim", "Midterm", "PreFinal", "Final"];

const ExamScheduleReport = () => {
  const { showToast } = useToast();

  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedExamType, setSelectedExamType] = useState("");
  const [exams, setExams] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getExamScheduleReport(
        selectedYear,
        selectedMonth,
        selectedExamType || undefined
      );
      setExams(data);
    } catch (err) {
      showToast("Failed to load schedule report.", "error");
      setExams({});
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth, selectedExamType, showToast]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handlePrint = () => {
    window.print();
  };

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);

  return (
    <>
      <style>{`
        @media print {
          .print-hide {
            display: none;
          }
          body {
            margin: 0;
            padding: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          td, th {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
            font-size: 12px;
          }
          th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          .page-break {
            page-break-after: always;
          }
          .section-title {
            font-size: 14px;
            font-weight: bold;
            margin-top: 20px;
            margin-bottom: 10px;
            text-align: center;
          }
        }
      `}</style>

      <div className="print-hide">

        <div className="rounded-xl border border-gray-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-6 mb-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {MONTHS.map((month, i) => (
                  <option key={i + 1} value={i + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Exam Type (Optional)
              </label>
              <select
                value={selectedExamType}
                onChange={(e) => setSelectedExamType(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">All Types</option>
                {EXAM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handlePrint}
                disabled={loading || Object.keys(exams).length === 0}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-blue-700 shadow-[0_4px_14px_rgba(37,99,235,0.39)] disabled:opacity-60 transition"
              >
                <IconFile className="h-4 w-4" />
                Print
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-gray-600">
            <IconLoader className="h-5 w-5 animate-spin" />
            Loading schedule...
          </div>
        ) : Object.keys(exams).length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            No exams found for the selected period.
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(exams).map(([dateKey, examsList]) => (
              <div key={dateKey} className="page-break">
                <div className="section-title text-lg font-black text-gray-800 mb-4 px-6 pt-4">{dateKey}</div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100 text-left">
                    <thead className="bg-gray-50/80">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap" style={{ width: "15%" }}>Course Year & Section</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap" style={{ width: "25%" }}>Subject Code and Title</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap" style={{ width: "20%" }}>Schedule</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap" style={{ width: "15%" }}>Room</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap" style={{ width: "25%" }}>Proctor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {examsList.map((exam, idx) => (
                        <tr key={exam._id || idx} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {exam.courseYear && exam.courseSection
                              ? `Year ${exam.courseYear} - Section ${exam.courseSection}`
                              : exam.courseYear
                              ? `Year ${exam.courseYear}`
                              : exam.courseSection
                              ? `Section ${exam.courseSection}`
                              : "—"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <strong className="text-gray-800 font-bold">{exam.subjectCode}</strong>
                            <br />
                            {exam.subject}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {exam.startTime && exam.endTime
                              ? `${exam.startTime} - ${exam.endTime}`
                              : exam.schedule || "—"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{exam.room || "—"}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{exam.proctorName || "Pending Assignment"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ExamScheduleReport;
