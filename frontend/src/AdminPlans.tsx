import { useEffect, useState, type FormEvent } from "react";
import { Plus, Search, RefreshCw, Pencil, Power, X, Package } from "lucide-react";
import adminApi from "./adminApi";

type Plan = {
  id: string;
  name: string;
  productType: "VPS_HOSTING" | "LINUX_IP_VPS";
  description: string | null;
  cpuCores: number;
  ramGb: number;
  storageGb: number;
  bandwidthGb: number | null;
  price: string | number;
  currency: string;
  durationDays: number;
  supportedOS: string[];
  isActive: boolean;
  sortOrder: number;
};

type PlanForm = {
  name: string;
  productType: "VPS_HOSTING" | "LINUX_IP_VPS";
  description: string;
  cpuCores: string;
  ramGb: string;
  storageGb: string;
  bandwidthGb: string;
  price: string;
  currency: string;
  durationDays: string;
  supportedOS: string;
  sortOrder: string;
};

const emptyForm: PlanForm = {
  name: "",
  productType: "VPS_HOSTING",
  description: "",
  cpuCores: "2",
  ramGb: "4",
  storageGb: "50",
  bandwidthGb: "",
  price: "",
  currency: "INR",
  durationDays: "30",
  supportedOS: "Ubuntu, Debian",
  sortOrder: "0",
};

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-[#080e1c] p-3 text-sm text-white outline-none focus:border-blue-500";

export default function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [productType, setProductType] = useState("");
  const [status, setStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState("");

  const loadPlans = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminApi.get("/admin/plans", {
        params: {
          search: search || undefined,
          productType: productType || undefined,
          active: status === "" ? undefined : status,
        },
      });
      const result = response.data;
      setPlans(Array.isArray(result) ? result : result.plans || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to load VPS plans.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, [search, productType, status]);

  const openCreate = () => {
    setEditingPlan(null);
    setForm({ ...emptyForm });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      productType: plan.productType,
      description: plan.description || "",
      cpuCores: String(plan.cpuCores),
      ramGb: String(plan.ramGb),
      storageGb: String(plan.storageGb),
      bandwidthGb: plan.bandwidthGb == null ? "" : String(plan.bandwidthGb),
      price: String(plan.price),
      currency: plan.currency,
      durationDays: String(plan.durationDays),
      supportedOS: (plan.supportedOS || []).join(", "),
      sortOrder: String(plan.sortOrder ?? 0),
    });
    setError("");
    setModalOpen(true);
  };

  const updateField = (field: keyof PlanForm, value: string) => {
    setForm(current => ({ ...current, [field]: value }));
  };

  const savePlan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      name: form.name.trim(),
      productType: form.productType,
      description: form.description.trim() || undefined,
      cpuCores: Number(form.cpuCores),
      ramGb: Number(form.ramGb),
      storageGb: Number(form.storageGb),
      bandwidthGb: form.bandwidthGb.trim() ? Number(form.bandwidthGb) : undefined,
      price: Number(form.price),
      currency: form.currency.trim().toUpperCase(),
      durationDays: Number(form.durationDays),
      supportedOS: form.supportedOS.split(",").map(os => os.trim()).filter(Boolean),
      sortOrder: Number(form.sortOrder || 0),
    };

    if (!payload.name || !Number.isFinite(payload.price) || payload.price <= 0 ||
        payload.cpuCores <= 0 || payload.ramGb <= 0 || payload.storageGb <= 0 ||
        payload.durationDays <= 0 || !payload.currency || payload.supportedOS.length === 0 ||
        (payload.bandwidthGb !== undefined && payload.bandwidthGb < 0)) {
      setError("Please enter valid plan details and at least one supported OS.");
      setSaving(false);
      return;
    }

    try {
      if (editingPlan) {
        await adminApi.patch(`/admin/plans/${editingPlan.id}`, payload);
      } else {
        await adminApi.post("/admin/plans", payload);
      }
      setModalOpen(false);
      setEditingPlan(null);
      await loadPlans();
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to save VPS plan.");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (plan: Plan) => {
    const nextStatus = !plan.isActive;
    const action = nextStatus ? "activate" : "deactivate";
    if (!window.confirm(`Are you sure you want to ${action} "${plan.name}"?`)) return;

    setActionLoading(plan.id);
    setError("");
    try {
      await adminApi.patch(`/admin/plans/${plan.id}/status`, { isActive: nextStatus });
      await loadPlans();
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to update plan status.");
    } finally {
      setActionLoading("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">VPS Plans Management</h1>
          <p className="mt-1 text-sm text-slate-400">Create and manage VPS products, pricing and configurations.</p>
        </div>
        <button onClick={openCreate} className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500">
          <Plus size={18} /> Add New Plan
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          <span>{error}</span>
          <button onClick={() => setError("")}><X size={16} /></button>
        </div>
      )}

      <div className="grid gap-3 rounded-xl border border-slate-800 bg-[#111a2b] p-4 md:grid-cols-3">
        <form onSubmit={e => { e.preventDefault(); setSearch(searchInput.trim()); }} className="relative">
          <Search size={17} className="absolute left-3 top-3.5 text-slate-500" />
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search plans..." className={`${inputClass} pl-10`} />
        </form>
        <select value={productType} onChange={e => setProductType(e.target.value)} className={inputClass}>
          <option value="">All product types</option>
          <option value="VPS_HOSTING">VPS Hosting</option>
          <option value="LINUX_IP_VPS">Linux IP VPS</option>
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className={inputClass}>
          <option value="">All plans</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#111a2b]">
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <h3 className="font-semibold">All VPS Plans</h3>
          <button onClick={loadPlans} disabled={loading} className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs hover:bg-slate-800 disabled:opacity-50">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400"><RefreshCw className="mx-auto mb-3 animate-spin" />Loading plans...</div>
        ) : plans.length === 0 ? (
          <div className="p-12 text-center text-slate-400"><Package size={34} className="mx-auto mb-3" />No plans found. Add your first VPS plan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead className="bg-[#0d1525] text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-5 py-4">Plan</th><th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Configuration</th><th className="px-5 py-4">Price</th>
                  <th className="px-5 py-4">Duration</th><th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {plans.map(plan => (
                  <tr key={plan.id} className="hover:bg-slate-800/40">
                    <td className="px-5 py-4"><p className="font-semibold">{plan.name}</p><p className="mt-1 text-xs text-slate-500">{plan.description || "No description"}</p></td>
                    <td className="px-5 py-4">{plan.productType === "VPS_HOSTING" ? "VPS Hosting" : "Linux IP VPS"}</td>
                    <td className="px-5 py-4 text-slate-300">{plan.cpuCores} CPU · {plan.ramGb} GB RAM<p className="mt-1 text-xs text-slate-500">{plan.storageGb} GB Storage{plan.bandwidthGb != null ? ` · ${plan.bandwidthGb} GB Bandwidth` : ""}</p></td>
                    <td className="px-5 py-4 font-semibold">{plan.currency} {Number(plan.price).toFixed(2)}</td>
                    <td className="px-5 py-4">{plan.durationDays} days</td>
                    <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs ${plan.isActive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>{plan.isActive ? "Active" : "Inactive"}</span></td>
                    <td className="px-5 py-4"><div className="flex items-center gap-2">
                      <button title="Edit plan" onClick={() => openEdit(plan)} className="rounded-lg border border-slate-700 p-2 text-blue-400 hover:bg-slate-700"><Pencil size={16} /></button>
                      <button title={plan.isActive ? "Deactivate" : "Activate"} disabled={actionLoading === plan.id} onClick={() => toggleStatus(plan)} className={`rounded-lg border border-slate-700 p-2 disabled:opacity-50 ${plan.isActive ? "text-red-400 hover:bg-red-500/10" : "text-green-400 hover:bg-green-500/10"}`}><Power size={16} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4" onClick={() => setModalOpen(false)}>
          <form onSubmit={savePlan} onClick={e => e.stopPropagation()} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-700 bg-[#111a2b] p-6">
            <div className="mb-6 flex items-center justify-between">
              <div><h2 className="text-xl font-bold">{editingPlan ? "Edit VPS Plan" : "Create VPS Plan"}</h2><p className="mt-1 text-xs text-slate-400">Configure product specifications and pricing.</p></div>
              <button type="button" onClick={() => setModalOpen(false)}><X /></button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-slate-300">Plan Name *<input required value={form.name} onChange={e => updateField("name", e.target.value)} className={`${inputClass} mt-2`} placeholder="Basic VPS" /></label>
              <label className="text-sm text-slate-300">Product Type *<select value={form.productType} onChange={e => updateField("productType", e.target.value)} className={`${inputClass} mt-2`}><option value="VPS_HOSTING">VPS Hosting</option><option value="LINUX_IP_VPS">Linux IP VPS</option></select></label>
              <label className="text-sm text-slate-300 sm:col-span-2">Description<textarea value={form.description} onChange={e => updateField("description", e.target.value)} className={`${inputClass} mt-2`} rows={2} placeholder="Plan description..." /></label>
              {([
                ["cpuCores", "CPU Cores *", "2"], ["ramGb", "RAM (GB) *", "4"],
                ["storageGb", "Storage (GB) *", "50"], ["bandwidthGb", "Bandwidth (GB)", "1000"],
                ["price", "Price *", "499"], ["durationDays", "Duration (Days) *", "30"],
                ["currency", "Currency *", "INR"], ["sortOrder", "Display Sort Order", "0"],
              ] as const).map(([field, label, placeholder]) => (
                <label key={field} className="text-sm text-slate-300">{label}<input required={field !== "bandwidthGb"} type={field === "currency" ? "text" : "number"} min={field === "sortOrder" ? 0 : field === "price" ? 0.01 : field === "bandwidthGb" ? 0 : 1} step={field === "price" ? "0.01" : "1"} value={form[field]} onChange={e => updateField(field, e.target.value)} className={`${inputClass} mt-2`} placeholder={placeholder} /></label>
              ))}
              <label className="text-sm text-slate-300 sm:col-span-2">Supported Operating Systems * (comma separated)<input required value={form.supportedOS} onChange={e => updateField("supportedOS", e.target.value)} className={`${inputClass} mt-2`} placeholder="Ubuntu, Debian, CentOS" /></label>
            </div>
            {error && <p className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-700 px-5 py-3 text-sm hover:bg-slate-800">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50">{saving ? "Saving..." : editingPlan ? "Update Plan" : "Create Plan"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
