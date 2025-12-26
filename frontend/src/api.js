const API_BASE = import.meta.env.VITE_API_BASE;

async function request(path, { method = "GET", headers, body } = {}) {
  const token = localStorage.getItem("expenseai_token");
  console.log(`[API] Fetching: ${API_BASE}${path}`);
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Authorization": token ? `Bearer ${token}` : "",
      ...(headers || {}),
    },
    body,
  });

  // For /export we return blob
  const contentType = res.headers.get("content-type") || "";
  if (!res.ok) {
    if (res.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("expenseai_token");
      if (!path.includes("/auth")) window.location.href = "/login";
    }
    let msg = `HTTP ${res.status}`;
    try {
      const data = contentType.includes("application/json") ? await res.json() : await res.text();
      msg = data?.detail ? String(data.detail) : JSON.stringify(data);
    } catch { }
    throw new Error(msg);
  }

  if (contentType.includes("application/json")) return await res.json();
  return await res.text();
}

export const api = {
  health: () => request("/health"),

  signup: (email, password) =>
    request("/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),

  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),

  getCategories: () => request("/categories"),
  addCategory: (name) =>
    request("/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }),

  uploadCsv: (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return request("/upload", { method: "POST", body: fd });
  },

  getTransactions: () => request("/transactions"),

  feedback: (transaction_id, new_category) =>
    request("/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transaction_id, new_category }),
    }),

  bulkFeedback: (updates) =>
    request("/feedback/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    }),

  retrain: () => request("/retrain", { method: "POST" }),

  exportCsv: async () => {
    const token = localStorage.getItem("expenseai_token");
    const res = await fetch(`${API_BASE}/export`, {
      method: "GET",
      headers: { "Authorization": token ? `Bearer ${token}` : "" },
    });
    if (!res.ok) throw new Error(`Export failed: HTTP ${res.status}`);
    return await res.blob();
  },
};
