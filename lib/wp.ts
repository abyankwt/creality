import "server-only";

export const getWpApiUrl = () => {
  const apiUrl = process.env.WC_BASE_URL;
  if (!apiUrl) {
    throw new Error("Missing WC_BASE_URL");
  }
  return apiUrl.replace(/\/$/, "");
};

export const getAdminAuthHeader = () => {
  const user = process.env.WP_APP_USER;
  const appPassword = process.env.WP_APP_PASSWORD;

  if (!user || !appPassword) {
    throw new Error("Missing WP application password credentials");
  }

  const token = Buffer.from(`${user}:${appPassword}`).toString("base64");
  return `Basic ${token}`;
};
