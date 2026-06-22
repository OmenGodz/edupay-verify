import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createExam,
  getAllExams,
  getExamsForMonth,
  assignProctor,
  removeProctor,
  deleteExam,
  updateExam,
} from "../api/examApi";
import { getAllUsers } from "../api/userManagementApi";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/ui/PageHeader";
import Drawer from "../components/ui/Drawer";
import Skeleton from "../components/ui/Skeleton";
import { IconLoader, IconX } from "../components/icons/Icons";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const EXAM_TYPES = ["Prelim", "Midterm", "PreFinal", "Final"];

const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month, 1).getDay();
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const ExamSchedule = () => {
  const { showToast } = useToast();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [exams, setExams] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Selected date and drawer state
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerMode, setDrawerMode] = useState("add"); // "add" or "edit"
  const [selectedExam, setSelectedExam] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    examType: "Prelim",
    subject: "",
    subjectCode: "",
    schedule: "",
    startTime: "",
    endTime: "",
    room: "",
    capacity: "",
    courseYear: "",
    courseSection: "",
  });

  const [selectedProctor, setSelectedProctor] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [examsData, teachersData] = await Promise.all([
        getExamsForMonth(year, month + 1),
        getAllUsers(),
      ]);
      setExams(examsData);
      const teachersList = teachersData.filter((u) => u.role === "teacher");
      setTeachers(teachersList);
    } catch (err) {
      showToast("Failed to load data.", "error");
    } finally {
      setLoading(false);
    }
  }, [year, month, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get exams for selected date
  const examsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return exams.filter((exam) => {
      const examDate = new Date(exam.examDate);
      return (
        examDate.getDate() === selectedDate.getDate() &&
        examDate.getMonth() === selectedDate.getMonth() &&
        examDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  }, [exams, selectedDate]);

  // Get dates that have exams
  const datesWithExams = useMemo(() => {
    return exams.map((exam) => new Date(exam.examDate).getDate());
  }, [exams]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDateClick = (day) => {
    const date = new Date(year, month, day);
    setSelectedDate(date);
    setDrawerMode("add");
    setFormData({
      examType: "Prelim",
      subject: "",
      subjectCode: "",
      schedule: "",
      startTime: "",
      endTime: "",
      room: "",
      capacity: "",
      courseYear: "",
      courseSection: "",
    });
    setSelectedExam(null);
    setSelectedProctor("");
    setShowDrawer(true);
  };

  const handleEditExam = (exam) => {
    setDrawerMode("edit");
    setSelectedExam(exam);
    setFormData({
      examType: exam.examType,
      subject: exam.subject,
      subjectCode: exam.subjectCode,
      schedule: exam.schedule,
      startTime: exam.startTime || "",
      endTime: exam.endTime || "",
      room: exam.room || "",
      capacity: exam.capacity || "",
      courseYear: exam.courseYear || "",
      courseSection: exam.courseSection || "",
    });
    setSelectedProctor(exam.proctorId?._id || exam.proctorId || "");
    setShowDrawer(true);
  };

  const handleAddExam = async () => {
    if (!formData.subject || !formData.subjectCode || !formData.schedule) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    setActionLoading(true);
    try {
      await createExam({
        examDate: selectedDate,
        ...formData,
        capacity: formData.capacity ? Number(formData.capacity) : null,
      });
      showToast("Exam added successfully.", "success");
      setShowDrawer(false);
      await fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add exam.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateExam = async () => {
    if (!formData.subject || !formData.subjectCode || !formData.schedule) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    setActionLoading(true);
    try {
      await updateExam(selectedExam._id, {
        ...formData,
        capacity: formData.capacity ? Number(formData.capacity) : null,
      });
      showToast("Exam updated successfully.", "success");
      setShowDrawer(false);
      await fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update exam.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignProctor = async () => {
    if (!selectedProctor) {
      showToast("Please select a teacher.", "error");
      return;
    }

    setActionLoading(true);
    try {
      await assignProctor(selectedExam._id, selectedProctor);
      showToast("Teacher assigned successfully.", "success");
      await fetchData();
      handleEditExam(selectedExam);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to assign teacher.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveProctor = async () => {
    setActionLoading(true);
    try {
      await removeProctor(selectedExam._id);
      showToast("Teacher removed successfully.", "success");
      await fetchData();
      handleEditExam(selectedExam);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to remove teacher.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteExam = async () => {
    if (!window.confirm("Are you sure you want to delete this exam?")) return;

    setActionLoading(true);
    try {
      await deleteExam(selectedExam._id);
      showToast("Exam deleted successfully.", "success");
      setShowDrawer(false);
      await fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete exam.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const calendarDays = [];
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInMonth = getDaysInMonth(year, month);

  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const drawerTitle = drawerMode === "add" ? "Add Exam" : "Edit Exam";

  return (
    <div>
      <PageHeader
        title="Exam Schedule"
        subtitle="Manage exam dates, subjects, and assign proctors."
      />

      <div className="grid gap-6 lg:grid-cols-4 lg:gap-8">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-gray-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
            {/* Month Header */}
            <div className="flex items-center justify-between border-b border-gray-100 p-6">
              <button
                onClick={handlePrevMonth}
                className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 transition"
              >
                ←
              </button>
              <h2 className="text-xl font-bold text-gray-800">
                {MONTHS[month]} {year}
              </h2>
              <button
                onClick={handleNextMonth}
                className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 transition"
              >
                →
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-0 bg-gray-50 text-center">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="border-r border-b border-gray-100 p-3 font-semibold text-gray-600 text-sm">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-0">
              {calendarDays.map((day, idx) => {
                const hasExams = day && datesWithExams.includes(day);
                const isToday =
                  day &&
                  new Date(year, month, day).toDateString() === new Date().toDateString();

                return (
                  <button
                    key={idx}
                    onClick={() => day && handleDateClick(day)}
                    disabled={!day}
                    className={`aspect-square min-h-24 border-r border-b border-gray-100 p-2 text-left transition ${
                      !day
                        ? "bg-gray-50 cursor-default"
                        : "hover:bg-blue-50 cursor-pointer"
                    } ${
                      isToday ? "bg-sti-gold/20" : ""
                    }`}
                  >
                    <div className="text-sm font-semibold text-gray-700">{day}</div>
                    {hasExams && (
                      <div className="mt-1 space-y-1">
                        {exams
                          .filter((e) => new Date(e.examDate).getDate() === day)
                          .slice(0, 2)
                          .map((e, i) => (
                            <div
                              key={i}
                              className="text-xs bg-sti-blue text-white px-1.5 py-0.5 rounded truncate"
                            >
                              {e.subjectCode}
                            </div>
                          ))}
                        {exams.filter((e) => new Date(e.examDate).getDate() === day).length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{exams.filter((e) => new Date(e.examDate).getDate() === day).length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar - Exams for Selected Date */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-gray-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {selectedDate ? formatDate(selectedDate) : "Select a Date"}
            </h3>

            {selectedDate && examsForSelectedDate.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-3">No exams scheduled</p>
                <button
                  onClick={() => handleDateClick(selectedDate.getDate())}
                  className="w-full rounded-lg bg-sti-blue text-white px-3 py-2 text-sm font-semibold hover:bg-blue-900 transition"
                >
                  + Add Exam
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {examsForSelectedDate.map((exam) => (
                  <button
                    key={exam._id}
                    onClick={() => handleEditExam(exam)}
                    className="w-full text-left rounded-lg border border-gray-200 p-3 hover:bg-blue-50 transition"
                  >
                    <p className="font-semibold text-sm text-gray-800">{exam.subjectCode}</p>
                    <p className="text-xs text-gray-600">{exam.schedule}</p>
                    {exam.proctorName && (
                      <p className="text-xs text-sti-blue mt-1">Proctor: {exam.proctorName}</p>
                    )}
                    {!exam.proctorName && (
                      <p className="text-xs text-red-600 mt-1">No proctor assigned</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drawer for Add/Edit Exam */}
      <Drawer open={showDrawer} onClose={() => setShowDrawer(false)} title={drawerTitle}>
        <div className="space-y-4">
          {drawerMode === "edit" && selectedExam && (
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
              <p className="font-semibold mb-1">Exam Details:</p>
              <p>{selectedExam.subject} ({selectedExam.subjectCode})</p>
              <p className="text-xs mt-1">{formatDate(selectedExam.examDate)} • {selectedExam.schedule}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Exam Type
            </label>
            <select
              value={formData.examType}
              onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-sti-blue focus:outline-none focus:ring-2 focus:ring-sti-blue/20"
            >
              {EXAM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g., Mathematics 101"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-sti-blue focus:outline-none focus:ring-2 focus:ring-sti-blue/20"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Subject Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.subjectCode}
              onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })}
              placeholder="e.g., MATH101"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-sti-blue focus:outline-none focus:ring-2 focus:ring-sti-blue/20"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Schedule <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.schedule}
              onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
              placeholder="e.g., 9:00 AM - 11:00 AM"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-sti-blue focus:outline-none focus:ring-2 focus:ring-sti-blue/20"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Room (Optional)
            </label>
            <input
              type="text"
              value={formData.room}
              onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              placeholder="e.g., Room 201"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-sti-blue focus:outline-none focus:ring-2 focus:ring-sti-blue/20"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Capacity (Optional)
            </label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              placeholder="e.g., 50"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-sti-blue focus:outline-none focus:ring-2 focus:ring-sti-blue/20"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Course Year (Optional)
            </label>
            <select
              value={formData.courseYear}
              onChange={(e) => setFormData({ ...formData, courseYear: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-sti-blue focus:outline-none focus:ring-2 focus:ring-sti-blue/20"
            >
              <option value="">Select year...</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Course Section (Optional)
            </label>
            <input
              type="text"
              value={formData.courseSection}
              onChange={(e) => setFormData({ ...formData, courseSection: e.target.value })}
              placeholder="e.g., A, B, or C"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-sti-blue focus:outline-none focus:ring-2 focus:ring-sti-blue/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Start Time (Optional)
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-sti-blue focus:outline-none focus:ring-2 focus:ring-sti-blue/20"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                End Time (Optional)
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-sti-blue focus:outline-none focus:ring-2 focus:ring-sti-blue/20"
              />
            </div>
          </div>

          {drawerMode === "edit" && selectedExam && (
            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Assign Proctor (Teacher)
              </label>
              <select
                value={selectedProctor}
                onChange={(e) => setSelectedProctor(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-sti-blue focus:outline-none focus:ring-2 focus:ring-sti-blue/20"
              >
                <option value="">Select a teacher...</option>
                {teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.name}
                  </option>
                ))}
              </select>

              {selectedExam.proctorName ? (
                <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm">
                  <p className="text-green-900 font-semibold">Proctor Assigned</p>
                  <p className="text-green-700">{selectedExam.proctorName}</p>
                  <button
                    onClick={handleRemoveProctor}
                    disabled={actionLoading}
                    className="mt-2 text-xs text-red-600 hover:text-red-700 font-semibold disabled:opacity-60"
                  >
                    Remove Proctor
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAssignProctor}
                  disabled={actionLoading || !selectedProctor}
                  className="mt-3 w-full rounded-lg bg-sti-blue text-white px-3 py-2.5 text-sm font-semibold hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-sti-blue/20 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <IconLoader className="h-4 w-4" /> : null}
                  Assign Proctor
                </button>
              )}
            </div>
          )}

          <div className="border-t border-gray-200 pt-4 flex gap-3">
            <button
              onClick={() => setShowDrawer(false)}
              disabled={actionLoading}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-60"
            >
              Cancel
            </button>

            {drawerMode === "edit" && (
              <button
                onClick={handleDeleteExam}
                disabled={actionLoading}
                className="flex-1 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition disabled:opacity-60"
              >
                Delete
              </button>
            )}

            <button
              onClick={drawerMode === "add" ? handleAddExam : handleUpdateExam}
              disabled={actionLoading}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-sti-gold px-3 py-2.5 text-sm font-bold text-sti-blue hover:bg-sti-gold-hover focus:outline-none focus:ring-2 focus:ring-sti-blue/20 disabled:opacity-60"
            >
              {actionLoading ? <IconLoader className="h-4 w-4" /> : null}
              {drawerMode === "add" ? "Add Exam" : "Update"}
            </button>
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default ExamSchedule;
