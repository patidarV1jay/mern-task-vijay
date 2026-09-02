import api from "./client";

export const filesApi = {
  async list(accessToken, params = {}) {
    const searchParams = new URLSearchParams();

    searchParams.set(
      "page",
      params.page || 1
    );

    searchParams.set(
      "limit",
      params.limit || 20
    );

    if (params.status) {
      searchParams.set("status", params.status);
    }

    if (params.type) {
      searchParams.set("type", params.type);
    }

    if (params.uploadedBy) {
      searchParams.set(
        "uploadedBy",
        params.uploadedBy
      );
    }

    const response = await api.get(
      `/files?${searchParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  },

  async upload(accessToken, file, onProgress) {
    const formData = new FormData();

    formData.append("file", file);

    const response = await api.post(
      "/files/upload",
      formData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        onUploadProgress: (event) => {
          if (!event.total) return;

          const progress = Math.round(
            (event.loaded * 100) / event.total
          );

          onProgress?.(progress);
        },
      }
    );

    return response.data;
  },

  async status(accessToken, fileId) {
    const response = await api.get(
      `/files/${fileId}/status`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  },

  async download(accessToken, fileId) {
    const response = await api.get(
      `/files/${fileId}/download`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  },
};