import { useEffect, useState, type FormEvent } from "react";
import {
  LayoutDashboard, Users, Server, ShoppingCart, CreditCard,
  Settings, ShieldCheck, LogOut, RefreshCw, Menu, X,
  Search, ChevronLeft, ChevronRight, Eye, Power, Mail, Calendar, Package,
} from "lucide-react";
import adminApi from "./adminApi";
import AdminPlans from "./AdminPlans";

type Stats = {
  totalCustomers: number;
  totalVps: number;
  activeVps: number;
  pendingVps: number;
  totalAdmins: number;
};

type Customer = {
  id: string;
  name: string | null;
  email: string;
  isActive: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
  _count: { vpsInstances: number };
};

type CustomerDetails = {
  id: string;
  name: string | null;
  email: string;
  isActive: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
  vpsInstances: {
    id: string;
    provider: string;
    ipAddress: string;
    hostname: string | null;
    operatingSystem: string | null;
    ram: number | null;
    status: string;
    expiresAt: string | null;
  }[];
};

type VpsRecord = {
  id: string;
  userId: string;
  provider: string;
  providerVpsId: string | null;
  ipAddress: string;
  hostname: string | null;
  operatingSystem: string | null;
  ram: number | null;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string | null; email: string };
};

type VpsStats = {
  total: number;
  running: number;
  stopped: number;
  pending: number;
  expired: number;
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function AdminPanel() {
  const [token, setToken] = useState(
    () => sessionStorage.getItem("admin_token") || ""
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [admin, setAdmin] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [page, setPage] = useState("Dashboard");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerStats, setCustomerStats] = useState({
    total: 0, active: 0, inactive: 0,
  });
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerDetails | null>(null);
  const [actionLoading, setActionLoading] = useState("");

  const [vpsInstances, setVpsInstances] = useState<VpsRecord[]>([]);
  const [vpsStats, setVpsStats] = useState<VpsStats | null>(null);
  const [vpsSearchInput, setVpsSearchInput] = useState("");
  const [vpsSearch, setVpsSearch] = useState("");
  const [vpsStatus, setVpsStatus] = useState("");
  const [vpsProvider, setVpsProvider] = useState("");
  const [vpsPage, setVpsPage] = useState(1);
  const [vpsTotalPages, setVpsTotalPages] = useState(1);
  const [vpsLoading, setVpsLoading] = useState(false);
  const [selectedVps, setSelectedVps] = useState<VpsRecord | null>(null);

  const logout = () => {
    sessionStorage.removeItem("admin_token");
    setToken("");
    setStats(null);
    setAdmin(null);
    setCustomers([]);
    setSelectedCustomer(null);
  };

  const loadDashboard = async () => {
    try {
      const [profile, dashboard] = await Promise.all([
        adminApi.get("/admin-auth/profile"),
        adminApi.get("/admin/dashboard/stats"),
      ]);
      setAdmin(profile.data);
      setStats(dashboard.data);
      setError("");
    } catch (err: any) {
      if ([401, 403].includes(err.response?.status)) logout();
      else setError(err.response?.data?.message || "Dashboard load failed.");
    }
  };

  const loadCustomers = async () => {
    setCustomerLoading(true);
    try {
      const [listResponse, statsResponse] = await Promise.all([
        adminApi.get("/admin/customers", {
          params: { search, page: currentPage, limit: 10 },
        }),
        adminApi.get("/admin/customers/stats"),
      ]);

      setCustomers(listResponse.data.customers);
      setTotalPages(Math.max(1, listResponse.data.pagination.totalPages));
      setCustomerStats(statsResponse.data);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to load customers.");
    } finally {
      setCustomerLoading(false);
    }
  };

  const loadVps = async () => {
    setVpsLoading(true);
    try {
      const [listResponse, statsResponse] = await Promise.all([
        adminApi.get("/admin/vps", {
          params: {
            search: vpsSearch || undefined,
            status: vpsStatus || undefined,
            provider: vpsProvider || undefined,
            page: vpsPage,
            limit: 10,
          },
        }),
        adminApi.get("/admin/vps/stats"),
      ]);

      setVpsInstances(listResponse.data.vpsInstances || []);
      setVpsTotalPages(
        Math.max(1, listResponse.data.pagination?.totalPages || 1)
      );
      setVpsStats(statsResponse.data);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to load VPS instances.");
    } finally {
      setVpsLoading(false);
    }
  };

  const openVps = async (id: string) => {
    try {
      const response = await adminApi.get(`/admin/vps/${id}`);
      setSelectedVps(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to load VPS details.");
    }
  };

  useEffect(() => {
    if (token) loadDashboard();
  }, [token]);

  useEffect(() => {
    if (token && page === "Customers") loadCustomers();
  }, [token, page, search, currentPage]);

  useEffect(() => {
    if (token && page === "VPS Management") loadVps();
  }, [token, page, vpsSearch, vpsStatus, vpsProvider, vpsPage]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await adminApi.post("/admin-auth/login", {
        email, password,
      });
      const receivedToken = response.data?.token;
      if (!receivedToken) throw new Error("Token not received from server.");

      sessionStorage.setItem("admin_token", receivedToken);
      setToken(receivedToken);
      setPassword("");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const openCustomer = async (id: string) => {
    try {
      setActionLoading(id);
      const response = await adminApi.get(`/admin/customers/${id}`);
      setSelectedCustomer(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to load customer.");
    } finally {
      setActionLoading("");
    }
  };

  const toggleCustomer = async (customer: Customer) => {
    const action = customer.isActive ? "deactivate" : "activate";
    if (!window.confirm(`Are you sure you want to ${action} this customer?`)) {
      return;
    }

    try {
      setActionLoading(customer.id);
      await adminApi.patch(`/admin/customers/${customer.id}/status`, {
        isActive: !customer.isActive,
      });
      await loadCustomers();

      if (selectedCustomer?.id === customer.id) {
        const response = await adminApi.get(`/admin/customers/${customer.id}`);
        setSelectedCustomer(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Status update failed.");
    } finally {
      setActionLoading("");
    }
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setSearch(searchInput.trim());
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080e1c] px-4 text-white">
        <form onSubmit={handleLogin} className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#111a2b] p-8">
          <div className="mb-6 text-center">
            <h1 className="text-4xl font-black">24<span className="text-blue-400">/7</span></h1>
            <p className="mt-2 text-xs tracking-[3px] text-slate-400">ADMIN PORTAL</p>
          </div>
          <h2 className="mb-6 text-xl font-bold">Admin Sign In</h2>
          <label className="mb-2 block text-sm text-slate-300">Email</label>
          <input type="email" required value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="admin@example.com"
            className="mb-5 w-full rounded-lg border border-slate-700 bg-[#080e1c] p-3 text-white outline-none focus:border-blue-500" />
          <label className="mb-2 block text-sm text-slate-300">Password</label>
          <input type="password" required value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter password"
            className="mb-5 w-full rounded-lg border border-slate-700 bg-[#080e1c] p-3 text-white outline-none focus:border-blue-500" />
          {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
          <button disabled={loading}
            className="w-full rounded-lg bg-blue-600 p-3 font-bold hover:bg-blue-500 disabled:opacity-50">
            {loading ? "Signing in..." : "Access Admin Panel"}
          </button>
        </form>
      </div>
    );
  }

  const links = [
    ["Dashboard", LayoutDashboard],
    ["Customers", Users],
    ["VPS Management", Server],
    ["Plans", Package],
    ["Orders", ShoppingCart],
    ["Payments & Wallet", CreditCard],
    ["Settings", Settings],
  ] as const;

  const cards = [
    ["Total Customers", stats?.totalCustomers, Users],
    ["Total VPS", stats?.totalVps, Server],
    ["Active VPS", stats?.activeVps, ShieldCheck],
    ["Pending VPS", stats?.pendingVps, RefreshCw],
    ["Total Admins", stats?.totalAdmins, Users],
  ] as const;

  return (
    <div className="min-h-screen bg-[#080e1c] text-white">
      {menuOpen && (
        <button aria-label="Close menu overlay" onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden" />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-800 bg-[#0d1525] p-5 transition-transform lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black">24<span className="text-blue-400">/7</span></h1>
            <p className="text-[10px] tracking-widest text-slate-500">ADMIN CONTROL</p>
          </div>
          <button onClick={() => setMenuOpen(false)} className="lg:hidden"><X /></button>
        </div>

        <nav className="space-y-2">
          {links.map(([label, Icon]) => (
            <button key={label}
              onClick={() => {
                setPage(label);
                setMenuOpen(false);
                setError("");
                setSelectedCustomer(null);
              }}
              className={`flex w-full items-center gap-3 rounded-lg p-3 text-sm transition ${page === label ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>

        <button onClick={logout}
          className="absolute bottom-6 left-5 flex items-center gap-3 rounded-lg p-3 text-sm text-red-400 hover:bg-red-500/10">
          <LogOut size={18} /> Sign Out
        </button>
      </aside>

      <main className="min-h-screen lg:pl-64">
        <header className="flex min-h-20 items-center justify-between gap-3 border-b border-slate-800 px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOpen(true)} className="lg:hidden"><Menu /></button>
            <div>
              <h2 className="font-bold">{page === "Dashboard" ? "Dashboard Overview" : page}</h2>
              <p className="text-xs text-slate-500">24/7 Hosting Administration</p>
            </div>
          </div>
          <button onClick={page === "Customers" ? loadCustomers : page === "VPS Management" ? loadVps : loadDashboard}
            className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800">
            <RefreshCw size={15} /> Refresh
          </button>
        </header>

        <section className="p-5 sm:p-8">
          {error && (
            <div className="mb-5 flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
              <button onClick={() => setError("")}><X size={16} /></button>
            </div>
          )}

          {page === "Dashboard" && (
            <>
              <h1 className="mb-1 text-2xl font-bold">Welcome, {admin?.name || "Admin"}</h1>
              <p className="mb-8 text-sm text-slate-400">{admin?.email}</p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {cards.map(([label, value, Icon]) => (
                  <div key={label} className="rounded-xl border border-slate-800 bg-[#111a2b] p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-400">{label}</p>
                      <Icon size={20} className="text-blue-400" />
                    </div>
                    <p className="mt-5 text-3xl font-bold">{value ?? "—"}</p>
                    <p className="mt-2 text-xs text-slate-500">Live database count</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {page === "Customers" && (
            <>
              <div className="mb-7">
                <h1 className="text-2xl font-bold">Customers Management</h1>
                <p className="mt-1 text-sm text-slate-400">View and manage registered customer accounts.</p>
              </div>

              <div className="mb-6 grid gap-4 sm:grid-cols-3">
                {[
                  ["Total Customers", customerStats.total, Users],
                  ["Active Customers", customerStats.active, ShieldCheck],
                  ["Inactive Customers", customerStats.inactive, Power],
                ].map(([label, value, Icon]: any) => (
                  <div key={label} className="rounded-xl border border-slate-800 bg-[#111a2b] p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-400">{label}</p>
                      <Icon size={20} className="text-blue-400" />
                    </div>
                    <p className="mt-4 text-3xl font-bold">{value}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSearch} className="mb-5 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 text-slate-500" size={18} />
                  <input value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    placeholder="Search customer by name or email..."
                    className="w-full rounded-lg border border-slate-700 bg-[#111a2b] py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500" />
                </div>
                <button type="submit" className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold hover:bg-blue-500">
                  Search
                </button>
              </form>

              <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#111a2b]">
                <div className="flex items-center justify-between border-b border-slate-800 p-4">
                  <h3 className="font-semibold">Customer List</h3>
                  <span className="text-xs text-slate-500">{customerStats.total} customers</span>
                </div>

                {customerLoading ? (
                  <div className="p-12 text-center text-slate-400">
                    <RefreshCw className="mx-auto mb-3 animate-spin" />
                    Loading customers...
                  </div>
                ) : customers.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <Users className="mx-auto mb-3" size={32} />
                    No customers found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#0d1525] text-xs uppercase text-slate-400">
                        <tr>
                          <th className="px-5 py-4">Customer</th>
                          <th className="px-5 py-4">VPS</th>
                          <th className="px-5 py-4">Joined</th>
                          <th className="px-5 py-4">Status</th>
                          <th className="px-5 py-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {customers.map(customer => (
                          <tr key={customer.id} className="hover:bg-slate-800/40">
                            <td className="px-5 py-4">
                              <p className="font-medium">{customer.name || "Unnamed"}</p>
                              <p className="mt-1 text-xs text-slate-500">{customer.email}</p>
                            </td>
                            <td className="px-5 py-4">{customer._count.vpsInstances}</td>
                            <td className="px-5 py-4 text-slate-400">{formatDate(customer.createdAt)}</td>
                            <td className="px-5 py-4">
                              <span className={`rounded-full px-3 py-1 text-xs ${customer.isActive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                                {customer.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <button title="View details"
                                  onClick={() => openCustomer(customer.id)}
                                  disabled={actionLoading === customer.id}
                                  className="rounded-lg border border-slate-700 p-2 text-blue-400 hover:bg-slate-700">
                                  <Eye size={16} />
                                </button>
                                <button title={customer.isActive ? "Deactivate" : "Activate"}
                                  onClick={() => toggleCustomer(customer)}
                                  disabled={actionLoading === customer.id}
                                  className={`rounded-lg border border-slate-700 p-2 ${customer.isActive ? "text-red-400 hover:bg-red-500/10" : "text-green-400 hover:bg-green-500/10"}`}>
                                  <Power size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-800 p-4">
                  <p className="text-xs text-slate-500">Page {currentPage} of {totalPages}</p>
                  <div className="flex gap-2">
                    <button disabled={currentPage <= 1 || customerLoading}
                      onClick={() => setCurrentPage(p => p - 1)}
                      className="rounded-lg border border-slate-700 p-2 disabled:opacity-30">
                      <ChevronLeft size={17} />
                    </button>
                    <button disabled={currentPage >= totalPages || customerLoading}
                      onClick={() => setCurrentPage(p => p + 1)}
                      className="rounded-lg border border-slate-700 p-2 disabled:opacity-30">
                      <ChevronRight size={17} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {page === "VPS Management" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">VPS Management</h2>
                <p className="mt-1 text-sm text-slate-400">
                  View and monitor all customer VPS instances.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                {[
                  ["Total VPS", vpsStats?.total ?? 0],
                  ["Running", vpsStats?.running ?? 0],
                  ["Stopped", vpsStats?.stopped ?? 0],
                  ["Pending", vpsStats?.pending ?? 0],
                  ["Expired", vpsStats?.expired ?? 0],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-slate-800 bg-[#111a2b] p-5">
                    <p className="text-sm text-slate-400">{label}</p>
                    <p className="mt-2 text-2xl font-bold">{value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#111a2b] p-5">
                <div className="mb-4 flex flex-col gap-3 lg:flex-row">
                  <div className="flex flex-1 gap-2">
                    <input
                      value={vpsSearchInput}
                      onChange={e => setVpsSearchInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          setVpsPage(1);
                          setVpsSearch(vpsSearchInput);
                        }
                      }}
                      placeholder="Search IP, hostname, customer name or email..."
                      className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-[#080e1c] p-3 text-sm outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => {
                        setVpsPage(1);
                        setVpsSearch(vpsSearchInput);
                      }}
                      className="rounded-lg bg-blue-600 px-4 text-sm font-semibold hover:bg-blue-500"
                    >
                      Search
                    </button>
                  </div>

                  <select
                    value={vpsStatus}
                    onChange={e => {
                      setVpsPage(1);
                      setVpsStatus(e.target.value);
                    }}
                    className="rounded-lg border border-slate-700 bg-[#080e1c] p-3 text-sm"
                  >
                    <option value="">All statuses</option>
                    <option value="RUNNING">Running</option>
                    <option value="STOPPED">Stopped</option>
                    <option value="PENDING">Pending</option>
                  </select>

                  <select
                    value={vpsProvider}
                    onChange={e => {
                      setVpsPage(1);
                      setVpsProvider(e.target.value);
                    }}
                    className="rounded-lg border border-slate-700 bg-[#080e1c] p-3 text-sm"
                  >
                    <option value="">All providers</option>
                    <option value="SMARTVPS">SMARTVPS</option>
                  </select>
                </div>

                {vpsLoading ? (
                  <div className="p-12 text-center text-slate-400">
                    <RefreshCw className="mx-auto mb-3 animate-spin" />
                    Loading VPS instances...
                  </div>
                ) : vpsInstances.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <Server className="mx-auto mb-3" size={34} />
                    No VPS instances found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-left text-sm">
                      <thead className="border-b border-slate-800 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-4 py-3">IP Address</th>
                          <th className="px-4 py-3">Customer</th>
                          <th className="px-4 py-3">Provider</th>
                          <th className="px-4 py-3">OS</th>
                          <th className="px-4 py-3">RAM</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Expiry</th>
                          <th className="px-4 py-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {vpsInstances.map(vps => (
                          <tr key={vps.id} className="hover:bg-slate-800/40">
                            <td className="px-4 py-4 font-mono">{vps.ipAddress}</td>
                            <td className="px-4 py-4">
                              <p>{vps.user?.name || "Unnamed"}</p>
                              <p className="text-xs text-slate-500">{vps.user?.email}</p>
                            </td>
                            <td className="px-4 py-4">{vps.provider}</td>
                            <td className="px-4 py-4">{vps.operatingSystem || "—"}</td>
                            <td className="px-4 py-4">{vps.ram ? `${vps.ram} GB` : "—"}</td>
                            <td className="px-4 py-4">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                vps.status === "RUNNING"
                                  ? "bg-green-500/15 text-green-400"
                                  : vps.status === "STOPPED"
                                  ? "bg-slate-500/20 text-slate-300"
                                  : "bg-yellow-500/15 text-yellow-400"
                              }`}>
                                {vps.status}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              {vps.expiresAt ? formatDate(vps.expiresAt) : "—"}
                            </td>
                            <td className="px-4 py-4">
                              <button
                                onClick={() => openVps(vps.id)}
                                className="flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-2 text-xs hover:bg-slate-700"
                              >
                                <Eye size={14} /> View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4">
                  <p className="text-xs text-slate-500">
                    Page {vpsPage} of {vpsTotalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={vpsPage <= 1 || vpsLoading}
                      onClick={() => setVpsPage(p => p - 1)}
                      className="rounded-lg border border-slate-700 p-2 disabled:opacity-30"
                    >
                      <ChevronLeft size={17} />
                    </button>
                    <button
                      disabled={vpsPage >= vpsTotalPages || vpsLoading}
                      onClick={() => setVpsPage(p => p + 1)}
                      className="rounded-lg border border-slate-700 p-2 disabled:opacity-30"
                    >
                      <ChevronRight size={17} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {page === "Plans" && <AdminPlans />}

          {page !== "Dashboard" && page !== "Customers" && page !== "VPS Management" && page !== "Plans" && (
            <div className="rounded-xl border border-slate-800 bg-[#111a2b] p-10 text-center">
              <Settings className="mx-auto mb-4 text-blue-400" size={36} />
              <h2 className="text-xl font-bold">{page}</h2>
              <p className="mt-2 text-sm text-slate-400">This module will be implemented next.</p>
            </div>
          )}
        </section>
      </main>

      {selectedVps && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedVps(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-700 bg-[#111a2b] p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">VPS Details</h2>
              <button onClick={() => setSelectedVps(null)}><X /></button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                ["IP Address", selectedVps.ipAddress],
                ["Hostname", selectedVps.hostname || "—"],
                ["Provider", selectedVps.provider],
                ["Provider VPS ID", selectedVps.providerVpsId || "—"],
                ["Operating System", selectedVps.operatingSystem || "—"],
                ["RAM", selectedVps.ram ? `${selectedVps.ram} GB` : "—"],
                ["Status", selectedVps.status],
                ["Expiry Date", selectedVps.expiresAt ? formatDate(selectedVps.expiresAt) : "—"],
                ["Customer", selectedVps.user?.name || "Unnamed"],
                ["Customer Email", selectedVps.user?.email || "—"],
                ["Created", formatDate(selectedVps.createdAt)],
                ["VPS ID", selectedVps.id],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-[#080e1c] p-3">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-1 break-all text-sm font-medium">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedCustomer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedCustomer(null)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-[#111a2b] p-6"
            onClick={e => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Customer Details</h2>
                <p className="text-xs text-slate-500">Account and VPS information</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="rounded-lg p-2 hover:bg-slate-700">
                <X />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-[#080e1c] p-4">
                <p className="mb-2 text-xs text-slate-500">Customer Name</p>
                <p className="font-semibold">{selectedCustomer.name || "Unnamed"}</p>
              </div>
              <div className="rounded-lg bg-[#080e1c] p-4">
                <p className="mb-2 flex items-center gap-2 text-xs text-slate-500"><Mail size={13}/> Email</p>
                <p className="break-all font-semibold">{selectedCustomer.email}</p>
              </div>
              <div className="rounded-lg bg-[#080e1c] p-4">
                <p className="mb-2 flex items-center gap-2 text-xs text-slate-500"><Calendar size={13}/> Registered</p>
                <p className="font-semibold">{formatDate(selectedCustomer.createdAt)}</p>
              </div>
              <div className="rounded-lg bg-[#080e1c] p-4">
                <p className="mb-2 text-xs text-slate-500">Account Status</p>
                <p className={selectedCustomer.isActive ? "font-semibold text-green-400" : "font-semibold text-red-400"}>
                  {selectedCustomer.isActive ? "Active" : "Inactive"}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="mb-3 font-semibold">Customer VPS Instances ({selectedCustomer.vpsInstances.length})</h3>
              {selectedCustomer.vpsInstances.length === 0 ? (
                <p className="rounded-lg bg-[#080e1c] p-5 text-sm text-slate-400">No VPS instances found.</p>
              ) : (
                <div className="space-y-3">
                  {selectedCustomer.vpsInstances.map(vps => (
                    <div key={vps.id} className="rounded-lg border border-slate-700 bg-[#080e1c] p-4">
                      <div className="flex flex-wrap justify-between gap-2">
                        <p className="font-semibold">{vps.ipAddress}</p>
                        <span className="text-xs text-blue-400">{vps.status}</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-400">
                        {vps.provider} · {vps.operatingSystem || "OS not specified"} · {vps.ram ? `${vps.ram} GB RAM` : "RAM N/A"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Expires: {vps.expiresAt ? formatDate(vps.expiresAt) : "Not specified"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                const customer = customers.find(c => c.id === selectedCustomer.id);
                if (customer) toggleCustomer(customer);
              }}
              disabled={actionLoading === selectedCustomer.id}
              className={`mt-6 w-full rounded-lg p-3 font-semibold ${selectedCustomer.isActive ? "bg-red-600 hover:bg-red-500" : "bg-green-600 hover:bg-green-500"}`}>
              {selectedCustomer.isActive ? "Deactivate Customer" : "Activate Customer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
