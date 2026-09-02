import api from "./client";

export const reportsApi = {
  async getSummary(accessToken) {
    const response = await api.get(
      `reports/summary`
    );

    return response.data;
  },
};