import { useEffect, useMemo, useState } from "react";
import { api } from "./api";

function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/90">
      {children}
    </span>
  );
}

function Button({ children, className = "", ...props }) {
  return (
    <button
      className={
        "rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15 active:bg-white/20 disabled:opacity-50 " +
        className
      }
      {...props}
    >
      {children}
    </button>
  );
}

function Card({ title, children, right }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {right}
      </div>
      {children}
    </div>
  );
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b0f19] p-5 text-white shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-lg font-semibold">{title}</div>
          <button className="rounded-lg px-2 py-1 hover:bg-white/10" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const [health, setHealth] = useState(null);
  const [categories, setCategories] = useState([]);
  const [txns, setTxns] = useState([]);
  const [loadingTxns, setLoadingTxns] = useState(false);

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadInfo, setUploadInfo] = useState("");

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [fixOpen, setFixOpen] = useState(false);
  const [fixTxn, setFixTxn] = useState(null);
  const [fixCategory, setFixCategory] = useState("");
  const [savingFix, setSavingFix] = useState(false);

  const [busyRetrain, setBusyRetrain] = useState(false);
  const [busyExport, setBusyExport] = useState(false);

  async function refreshHealth() {
    const h = await api.health();
    setHealth(h);
  }

  async function refreshCategories() {
    const c = await api.getCategories();
    setCategories(c.categories || []);
  }

  async function refreshTransactions() {
    setLoadingTxns(true);
    try {
      const list = await api.getTransactions();
      // backend returns newest first in your output; keep as is
      setTxns(Array.isArray(list) ? list : []);
    } finally {
      setLoadingTxns(false);
    }
  }

  useEffect(() => {
    (async () => {
      await refreshHealth();
      await refreshCategories();
      await refreshTransactions();
    })();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return txns;
    return txns.filter((t) => {
      const d = (t.description || "").toLowerCase();
      const p = (t.predicted_category || "").toLowerCase();
      const f = (t.final_category || "").toLowerCase();
      return d.includes(needle) || p.includes(needle) || f.includes(needle);
    });
  }, [txns, q]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > pageCount) setPage(1);
  }, [pageCount]);

  async function onUpload() {
    if (!file) return;
    setUploading(true);
    setUploadInfo("");
    try {
      const out = await api.uploadCsv(file);
      setUploadInfo(`Uploaded + predicted ${out.length} transactions.`);
      // Refresh DB table after upload
      await refreshTransactions();
    } catch (e) {
      setUploadInfo(`Upload failed: ${e.message}`);
    } finally {
      setUploading(false);
    }
  }

  function openFix(t) {
    setFixTxn(t);
    setFixCategory(t.final_category || "");
    setFixOpen(true);
  }

  async function saveFix() {
    if (!fixTxn) return;
    if (!fixCategory) return;

    setSavingFix(true);
    try {
      const updated = await api.feedback(fixTxn.id, fixCategory);
      // update in local state
      setTxns((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      setFixOpen(false);
    } catch (e) {
      alert(`Feedback failed: ${e.message}`);
    } finally {
      setSavingFix(false);
    }
  }

  async function runRetrain() {
    setBusyRetrain(true);
    try {
      const r = await api.retrain();
      alert(`Retrain OK.\nbase_rows=${r.base_rows}\ncorrections_rows=${r.corrections_rows}`);
      await refreshHealth();
    } catch (e) {
      alert(`Retrain failed: ${e.message}`);
    } finally {
      setBusyRetrain(false);
    }
  }

  async function downloadExport() {
    setBusyExport(true);
    try {
      const blob = await api.exportCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "expenseai_export.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(`Export failed: ${e.message}`);
    } finally {
      setBusyExport(false);
    }
  }

  return (
    <div className="min-h-full bg-[#0b0f19] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-3xl font-bold tracking-tight">ExpenseAI</div>
            <div className="mt-2 flex flex-wrap gap-2 text-sm text-white/70">
              <Badge>API: {health ? (health.ok ? "OK" : "DOWN") : "…"}</Badge>
              <Badge>ML Ready: {health ? (health.ml_ready ? "Yes" : "No") : "…"}</Badge>
              <Badge>Categories: {categories.length}</Badge>
              <Badge>Transactions: {txns.length}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={runRetrain} disabled={busyRetrain}>
              {busyRetrain ? "Retraining…" : "Retrain"}
            </Button>
            <Button onClick={downloadExport} disabled={busyExport}>
              {busyExport ? "Exporting…" : "Export CSV"}
            </Button>
            <Button onClick={() => Promise.all([refreshHealth(), refreshCategories(), refreshTransactions()])}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* Upload */}
          <Card title="Upload CSV">
            <div className="flex flex-col gap-3">
              <input
                className="block w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:text-white hover:file:bg-white/15"
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <div className="flex items-center gap-2">
                <Button onClick={onUpload} disabled={!file || uploading}>
                  {uploading ? "Uploading…" : "Upload & Predict"}
                </Button>
                <span className="text-sm text-white/70">{file ? file.name : "Choose expenseAI_cleaned_dataset.csv"}</span>
              </div>
              {uploadInfo ? <div className="text-sm text-white/80">{uploadInfo}</div> : null}
            </div>
          </Card>

          {/* Categories preview */}
          <Card title="Categories">
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <span key={c} className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/90">
                  {c}
                </span>
              ))}
            </div>
            <div className="mt-3 text-xs text-white/60">
              Tip: Add categories in Swagger (or we can build “Add category” UI next).
            </div>
          </Card>
        </div>

        {/* Transactions */}
        <div className="mt-5">
          <Card
            title="Transactions"
            right={
              <input
                className="w-64 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
                placeholder="Search description/category…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            }
          >
            <div className="overflow-auto rounded-xl border border-white/10">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/5 text-white/70">
                  <tr>
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Predicted</th>
                    <th className="px-3 py-2">Final</th>
                    <th className="px-3 py-2">Conf</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {loadingTxns ? (
                    <tr>
                      <td className="px-3 py-4 text-white/70" colSpan={8}>
                        Loading…
                      </td>
                    </tr>
                  ) : pageItems.length === 0 ? (
                    <tr>
                      <td className="px-3 py-4 text-white/70" colSpan={8}>
                        No transactions.
                      </td>
                    </tr>
                  ) : (
                    pageItems.map((t) => (
                      <tr key={t.id} className="border-t border-white/10 hover:bg-white/5">
                        <td className="px-3 py-2 text-white/80">{t.id}</td>
                        <td className="px-3 py-2 text-white/70">{t.txn_date || "-"}</td>
                        <td className="px-3 py-2">{t.description}</td>
                        <td className="px-3 py-2">{Number(t.amount).toFixed(2)}</td>
                        <td className="px-3 py-2">
                          <Badge>{t.predicted_category}</Badge>
                        </td>
                        <td className="px-3 py-2">
                          {t.final_category ? <Badge>{t.final_category}</Badge> : <span className="text-white/40">—</span>}
                        </td>
                        <td className="px-3 py-2 text-white/80">
                          {typeof t.confidence === "number" ? t.confidence.toFixed(3) : "-"}
                        </td>
                        <td className="px-3 py-2">
                          <Button className="px-3 py-1" onClick={() => openFix(t)}>
                            Fix
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between text-sm text-white/70">
              <div>
                Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} of {filtered.length}
              </div>
              <div className="flex items-center gap-2">
                <Button className="px-3 py-1" onClick={() => setPage(1)} disabled={page === 1}>
                  {"<<"}
                </Button>
                <Button className="px-3 py-1" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  {"<"}
                </Button>
                <span>
                  Page {page} / {pageCount}
                </span>
                <Button className="px-3 py-1" onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount}>
                  {">"}
                </Button>
                <Button className="px-3 py-1" onClick={() => setPage(pageCount)} disabled={page === pageCount}>
                  {">>"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Feedback Modal */}
      <Modal open={fixOpen} title="Send Feedback" onClose={() => setFixOpen(false)}>
        {fixTxn ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
              <div><span className="text-white/60">ID:</span> {fixTxn.id}</div>
              <div><span className="text-white/60">Description:</span> {fixTxn.description}</div>
              <div className="flex gap-2">
                <span className="text-white/60">Predicted:</span> <Badge>{fixTxn.predicted_category}</Badge>
                {fixTxn.final_category ? (
                  <>
                    <span className="text-white/60">Final:</span> <Badge>{fixTxn.final_category}</Badge>
                  </>
                ) : null}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm text-white/70">New category</div>
              <select
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                value={fixCategory}
                onChange={(e) => setFixCategory(e.target.value)}
              >
                <option value="" className="bg-[#0b0f19]">Select…</option>
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-[#0b0f19]">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <Button className="bg-white/5" onClick={() => setFixOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveFix} disabled={!fixCategory || savingFix}>
                {savingFix ? "Saving…" : "Save feedback"}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
