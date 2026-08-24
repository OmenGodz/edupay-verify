import API from "./client";

export const getAllUsers = async () => {
  const res = await API.get("/users");
  return res.data;
};

export const getPendingStudents = async () => {
  const res = await API.get("/users/pending-students");
  return res.data;
};

export const verifyStudent = async (id) => {
  const res = await API.patch(`/users/${id}/verify`);
  return res.data;
};

export const rejectStudent = async (id, rejectionReason) => {
  const res = await API.patch(`/users/${id}/reject`, { rejectionReason });
  return res.data;
};

export const createUser = async (data) => {
  const res = await API.post("/users", data);
  return res.data;
};

export const updateUser = async (id, data) => {
  const res = await API.patch(`/users/${id}`, data);
  return res.data;
};

export const resetUserPassword = async (id, password) => {
  const res = await API.patch(`/users/${id}/reset-password`, { password });
  return res.data;
};

export const deactivateUser = async (id) => {
  const res = await API.patch(`/users/${id}/deactivate`);
  return res.data;
};
