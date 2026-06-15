import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import {
  decideExamPermit,
  scanExamPermit,
} from "../api/eligibilityApi";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";
import {
  IconCheckCircle,
  IconLoader,
  IconQrCode,
  IconXCircle,
} from "../components/icons/Icons";

const extractToken = (value) => {
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const parsed = JSON.parse(trimmed);
    return parsed.token || trimmed;
  } catch {
    return trimmed;
  }
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const TeacherProctor = () => {
  const { showToast } = useToast();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanControlsRef = useRef(null);
  const scanningRef = useRef(false);

  const [manualCode, setManualCode] = useState("");
  const [cameraMessage, setCameraMessage] = useState("");
  const [permit, setPermit] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [error, setError] = useState("");

  const stopCamera = () => {
    scanningRef.current = false;
    scanControlsRef.current?.stop();
    scanControlsRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  useEffect(() => stopCamera, []);

  const verifyToken = async (rawValue) => {
    const token = extractToken(rawValue);
    if (!token || loading) return;

    setLoading(true);
    setError("");
    try {
      const data = await scanExamPermit(token);
      setPermit(data);
      setManualCode("");
      stopCamera();
      showToast("Exam permit scanned.", "success");
    } catch (err) {
      const msg = err.response?.data?.message || "Could not verify QR code.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    setCameraMessage("");
    setError("");

    setCameraLoading(true);
    try {
      stopCamera();
      scanningRef.current = true;

      const codeReader = new BrowserQRCodeReader();
      const controls = await codeReader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        async (result) => {
          if (!result || !scanningRef.current) return;

          scanningRef.current = false;
          controls.stop();
          scanControlsRef.current = null;
          await verifyToken(result.getText());
        }
      );

      scanControlsRef.current = controls;
    } catch {
      setCameraMessage("Could not open the camera. Check browser permissions or paste the QR payload.");
    } finally {
      setCameraLoading(false);
    }
  };

  const handleDecision = async (decision) => {
    if (!permit) return;

    setDecisionLoading(true);
    setError("");
    try {
      const data = await decideExamPermit(permit._id, decision, remarks);
      setPermit(data);
      showToast(`Student ${decision.toLowerCase()} for the exam.`, "success");
    } catch (err) {
      const msg = err.response?.data?.message || "Could not save proctor decision.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setDecisionLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Exam Proctor"
        subtitle="Scan student permit QR codes and record exam admission decisions."
      />

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
            <h2 className="text-lg font-bold text-gray-800">QR Scanner</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Use the camera or paste the QR payload from the student permit.
            </p>
          </div>

          <div className="space-y-5 p-6">
            <div className="overflow-hidden rounded-xl border border-gray-100 bg-gray-950">
              <video
                ref={videoRef}
                muted
                playsInline
                className="aspect-video w-full object-cover"
              />
            </div>

            {cameraMessage && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                {cameraMessage}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={startCamera}
                disabled={cameraLoading || loading}
                className="flex min-h-11 items-center gap-2 rounded-lg bg-sti-blue px-4 py-2.5 text-sm font-bold text-white transition hover:bg-sti-blue-light focus:outline-none focus:ring-2 focus:ring-sti-blue/20 disabled:opacity-60"
              >
                {cameraLoading ? <IconLoader className="h-4 w-4" /> : <IconQrCode className="h-4 w-4" />}
                Start Scan
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="min-h-11 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sti-blue/20"
              >
                Stop Camera
              </button>
            </div>

            <div>
              <label htmlFor="manualCode" className="mb-1.5 block text-sm font-medium text-gray-700">
                Manual QR Payload or Token
              </label>
              <textarea
                id="manualCode"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                rows={4}
                placeholder='Paste {"permitId":"...","token":"..."} or the token'
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm shadow-sm outline-none focus:border-sti-blue focus:ring-2 focus:ring-sti-blue/20"
              />
            </div>

            <button
              type="button"
              onClick={() => verifyToken(manualCode)}
              disabled={loading || !manualCode.trim()}
              className="flex min-h-11 items-center gap-2 rounded-lg bg-sti-gold px-5 py-2.5 text-sm font-black text-sti-blue shadow-[0_8px_20px_rgba(255,199,44,0.25)] transition hover:bg-sti-gold-hover focus:outline-none focus:ring-2 focus:ring-sti-blue/20 disabled:opacity-60"
            >
              {loading ? <IconLoader className="h-4 w-4" /> : null}
              Verify Permit
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
            <h2 className="text-lg font-bold text-gray-800">Scanned Permit</h2>
          </div>

          {permit ? (
            <div className="space-y-5 p-6">
              <dl className="space-y-3 text-sm">
                {[
                  ["Student", permit.studentName],
                  ["Student ID", permit.studentId],
                  ["Exam", permit.examType],
                  ["Permit", permit.permitStatus],
                  ["Proctor Decision", permit.proctorDecision],
                  ["Last Teacher", permit.proctorTeacherName],
                  ["Decided At", formatDateTime(permit.proctorDecidedAt)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 border-b border-gray-50 pb-3">
                    <dt className="font-medium text-gray-500">{label}</dt>
                    <dd className="text-right font-semibold text-gray-800">
                      {label === "Proctor Decision" ? (
                        <StatusBadge status={value} />
                      ) : (
                        value || "-"
                      )}
                    </dd>
                  </div>
                ))}
              </dl>

              <div>
                <label htmlFor="remarks" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Remarks
                </label>
                <textarea
                  id="remarks"
                  rows={4}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Optional proctor notes"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm shadow-sm outline-none focus:border-sti-blue focus:ring-2 focus:ring-sti-blue/20"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleDecision("Rejected")}
                  disabled={decisionLoading}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:border-red-600 hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-60"
                >
                  <IconXCircle className="h-4 w-4" />
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision("Approved")}
                  disabled={decisionLoading}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-sti-gold px-4 py-2.5 text-sm font-black text-sti-blue shadow-[0_8px_20px_rgba(255,199,44,0.25)] transition hover:bg-sti-gold-hover focus:outline-none focus:ring-2 focus:ring-sti-blue/20 disabled:opacity-60"
                >
                  {decisionLoading ? <IconLoader className="h-4 w-4" /> : <IconCheckCircle className="h-4 w-4" />}
                  Approve
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-sm text-gray-500">
              No permit scanned yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherProctor;
