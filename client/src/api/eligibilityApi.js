import API from "./client";

export const getEligibility = async (studentId) => {
  const res = await API.get(`/eligibility/${studentId}`);
  return res.data;
};

export const generateQR = async (studentId, examType) => {
  const res = await API.post("/qr/generate", { studentId, examType });
  return res.data;
};

export const getStudentPermits = async (studentId) => {
  const res = await API.get(`/qr/student/${studentId}`);
  return res.data;
};

export const scanExamPermit = async (token) => {
  const res = await API.post("/qr/scan", { token });
  return res.data;
};

export const decideExamPermit = async (permitId, decision, remarks) => {
  const res = await API.put(`/qr/${permitId}/proctor-decision`, {
    decision,
    remarks,
  });
  return res.data;
};
