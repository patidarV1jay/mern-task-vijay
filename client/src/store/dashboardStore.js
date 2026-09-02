import { create } from "zustand";
import { reportsApi } from "../api/reports.js";

export const useDashboardStore = create((set) => ({
  summary: null,
  loading: false,
  error: null,

  fetchSummary: async (accessToken) => {
    try {
      set({
        loading: true,
        error: null,
      });

      const response = await reportsApi.getSummary(accessToken);

      set({
        summary: response.data,
        loading: false,
      });
    } catch (error) {
      console.error("Failed to load dashboard:", error);

      set({
        loading: false,
        error: "Unable to load dashboard.",
      });
    }
  },
}));