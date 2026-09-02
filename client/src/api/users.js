import api from "./client";

export const usersApi = {
  list: ({
    page = 1,
    limit = 20,
    search = "",
    role = "",
  } = {}) => {
    const params = {
      page,
      limit,
    };

    if (search.trim()) {
      params.search = search.trim();
    }

    if (role) {
      params.role = role;
    }

    return api.get("/users", {
      params,
    });
  },
};