import api from "./api";

export const getNotifications = async () => {
  try {
    console.log("Fetching notifications...");
    const response = await api.get("/notifications");
    console.log("Notifications response:", response.data);

    const payload = response.data;
    const notifications = Array.isArray(payload?.notifications)
      ? payload.notifications
      : Array.isArray(payload)
        ? payload
        : [];

    return notifications;
  } catch (error: any) {
    console.error("Notification error:", error?.response?.status);
    console.error(
      "Notification error data:",
      JSON.stringify(error?.response?.data),
    );
    console.error("Notification message:", error?.message);
    throw error;
  }
};

export const markAllRead = async () => {
  const response = await api.patch("/notifications/read-all");
  return response.data;
};

export const markRead = async (id: string) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};
