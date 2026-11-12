// Matches the existing backend config/app.php. Override for another deployment.
export const NEWS_TIME_ZONE = process.env.EXPO_PUBLIC_NEWS_TIME_ZONE || "Asia/Kuala_Lumpur";
export const NEWS_STALE_TIME = 5 * 60 * 1000;
