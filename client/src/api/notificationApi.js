import API from "./client";

export const getMyNotifications = async () => {
  const res = await API.get("/notifications");
  return res.data;
};

export const markMyNotificationsRead = async () => {
  const res = await API.patch("/notifications/read");
  return res.data;
};
