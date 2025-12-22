const API_BASE = import.meta.env.VITE_API_BASE;
const API_TOKEN = import.meta.env.VITE_API_TOKEN;

async function request(path, { method = "GET", headers, body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "x-api-token": API_TOKEN,
      ...(headers || {}),
    },
    body,
  });

  // For /export we return blob
  const contentType = res.headers.get("content-type") || "";
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = contentType.includes("application/json") ? await res.json() : await res.text();
      msg = data?.detail ? String(data.detail) : JSON.stringify(data);
    } catch {}
    throw new Error(msg);
  }

  if (contentType.includes("application/json")) return await res.json();
  return await res.text();
}

export const api = {
  health: () => request("/health"),
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

  retrain: () => request("/retrain", { method: "POST" }),

  exportCsv: async () => {
    const res = await fetch(`${API_BASE}/export`, {
      method: "GET",
      headers: { "x-api-token": API_TOKEN },
    });
    if (!res.ok) throw new Error(`Export failed: HTTP ${res.status}`);
    return await res.blob();
  },
};
