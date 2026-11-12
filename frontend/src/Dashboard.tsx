
import { useCallback, useEffect, useState } from "react";
import {
  LayoutDashboard,
  Server,
  ShoppingCart,
  Wallet,
  Receipt,
  Headphones,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  Activity,
  ShieldCheck,
  ArrowUpRight,
  Cpu,
  HardDrive,
  MemoryStick,
  Globe,
  ChevronRight,
  Bell,
  User,
  CreditCard,
  Zap,
  Power,
  PowerOff,
  RefreshCw,
} from "lucide-react";

import api from "./api";

type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerifiedAt: string | null;
  isActive: boolean;
  createdAt: string;
};

type VPSInstance = {
  id: string;
  userId: string;
  provider: string;
  ipAddress: string;
  hostname: string | null;
  operatingSystem: string | null;
  ram: number | null;
  status: string;
  expiresAt: string | null;
  createdAt: string;
};

const menuItems = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "My VPS", icon: Server },
  { name: "Buy VPS", icon: ShoppingCart },
  { name: "Wallet", icon: Wallet },
  { name: "Orders & Billing", icon: Receipt },
  { name: "Support", icon: Headphones },
  { name: "Settings", icon: Settings },
];

export default function Dashboard() {
  const [activeMenu, setActiveMenu] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  const [vpsList, setVpsList] = useState<VPSInstance[]>([]);
  const [vpsLoading, setVpsLoading] = useState(true);
  const [vpsError, setVpsError] = useState("");
  const [vpsMessage, setVpsMessage] = useState("");

  const [vpsActionLoading, setVpsActionLoading] = useState<string | null>(
    null
  );
  const [provisionLoading, setProvisionLoading] = useState(false);

  // Fetch logged-in user's VPS list
  const fetchVps = useCallback(async () => {
    try {
      setVpsLoading(true);
      setVpsError("");

      const response = await api.get("/vps");

      setVpsList(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      if (error.response?.status === 401) {
        sessionStorage.removeItem("indiccloud_token");
        window.location.href = "/login";
        return;
      }

      setVpsError(
        error.response?.data?.message || "Unable to load VPS instances."
      );
    } finally {
      setVpsLoading(false);
    }
  }, []);

  // Fetch user profile
  useEffect(() => {
    let cancelled = false;

    const fetchProfile = async () => {
      const token = sessionStorage.getItem("indiccloud_token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      try {
        const response = await api.get("/profile");

        if (!cancelled) {
          setProfile(response.data);
          setProfileError("");
        }
      } catch (error: any) {
        if (cancelled) return;

        if (error.response?.status === 401) {
          sessionStorage.removeItem("indiccloud_token");
          window.location.href = "/login";
          return;
        }

        setProfileError(
          error.response?.data?.message ||
            "Unable to load account information."
        );
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch VPS list when dashboard loads
  useEffect(() => {
    fetchVps();
  }, [fetchVps]);

  // Create demo VPS
  const provisionDemoVps = async () => {
    try {
      setProvisionLoading(true);
      setVpsError("");
      setVpsMessage("");

      const response = await api.post("/vps/demo/provision");

      setVpsMessage(
        response.data.message || "Demo VPS created successfully."
      );

      await fetchVps();
      setActiveMenu("My VPS");
    } catch (error: any) {
      setVpsError(
        error.response?.data?.message || "Unable to provision demo VPS."
      );
    } finally {
      setProvisionLoading(false);
    }
  };

  // Start or Stop VPS
  const handleVpsAction = async (
    id: string,
    action: "start" | "stop"
  ) => {
    try {
      setVpsActionLoading(id);
      setVpsError("");
      setVpsMessage("");

      const response = await api.post(`/vps/${id}/${action}`);

      setVpsMessage(
        response.data.message || `VPS ${action} request successful.`
      );

      await fetchVps();
    } catch (error: any) {
      setVpsError(
        error.response?.data?.message || `Unable to ${action} VPS.`
      );
    } finally {
      setVpsActionLoading(null);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("indiccloud_token");
    window.location.href = "/login";
  };

  const handleMenuClick = (menu: string) => {
    setActiveMenu(menu);
    setSidebarOpen(false);
    setVpsMessage("");
    setVpsError("");

    if (menu === "My VPS" || menu === "Overview") {
      fetchVps();
    }
  };

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "IC";

  const activeVpsCount = vpsList.filter(
    (vps) => vps.status === "RUNNING"
  ).length;

  const stats = [
    {
      title: "Total VPS",
      value: String(vpsList.length),
      description: "All your VPS instances",
      icon: Server,
    },
    {
      title: "Wallet Balance",
      value: "₹0.00",
      description: "Available account balance",
      icon: Wallet,
    },
    {
      title: "Active Services",
      value: String(activeVpsCount),
      description: "Currently running services",
      icon: Activity,
    },
    {
      title: "Pending Orders",
      value: "0",
      description: "Orders awaiting completion",
      icon: ShoppingCart,
    },
  ];

  const renderVpsCard = (vps: VPSInstance) => (
    <div
      key={vps.id}
      className="rounded-2xl border border-slate-800 bg-[#0d1627] p-5 transition hover:border-blue-500/40 sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
            <Server size={22} />
          </div>

          <div className="min-w-0">
            <h3 className="truncate font-bold">
              {vps.hostname || "VPS Server"}
            </h3>
            <p className="text-xs text-slate-500">{vps.provider}</p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
            vps.status === "RUNNING"
              ? "bg-green-500/10 text-green-400"
              : vps.status === "STOPPED"
                ? "bg-slate-700 text-slate-300"
                : "bg-yellow-500/10 text-yellow-400"
          }`}
        >
          {vps.status}
        </span>
      </div>

      <div className="mt-5">
        <p className="text-xs text-slate-500">IP Address</p>
        <p className="mt-1 text-xl font-bold text-blue-400">
          {vps.ipAddress}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-slate-500">Operating System</p>
          <p className="mt-1 text-sm font-medium">
            {vps.operatingSystem || "N/A"}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500">RAM</p>
          <p className="mt-1 text-sm font-medium">
            {vps.ram ?? "N/A"} GB
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500">Expiry Date</p>
          <p className="mt-1 text-sm font-medium">
            {vps.expiresAt
              ? new Date(vps.expiresAt).toLocaleDateString()
              : "N/A"}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500">Server Type</p>
          <p className="mt-1 text-sm font-medium">Demo VPS</p>
        </div>
      </div>

      <div className="mt-6 border-t border-slate-800 pt-5">
        {vps.status === "RUNNING" ? (
          <button
            onClick={() => handleVpsAction(vps.id, "stop")}
            disabled={vpsActionLoading === vps.id}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {vpsActionLoading === vps.id ? (
              <RefreshCw size={17} className="animate-spin" />
            ) : (
              <PowerOff size={17} />
            )}
            {vpsActionLoading === vps.id ? "Processing..." : "Stop VPS"}
          </button>
        ) : (
          <button
            onClick={() => handleVpsAction(vps.id, "start")}
            disabled={vpsActionLoading === vps.id}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {vpsActionLoading === vps.id ? (
              <RefreshCw size={17} className="animate-spin" />
            ) : (
              <Power size={17} />
            )}
            {vpsActionLoading === vps.id ? "Processing..." : "Start VPS"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080e1b] text-white">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-[#0b1220] transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b border-slate-800 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <Server size={22} />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-wide">
                Indic<span className="text-blue-500">Cloud</span>
              </h1>
              <p className="text-[10px] tracking-[2px] text-slate-500">
                VPS HOSTING
              </p>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="text-slate-400 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={21} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[2px] text-slate-500">
            Main Menu
          </p>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.name;

              return (
                <button
                  key={item.name}
                  onClick={() => handleMenuClick(item.name)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon size={19} />
                  <span>{item.name}</span>

                  {isActive && (
                    <ChevronRight size={16} className="ml-auto" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Support Card */}
          <div className="mt-10 rounded-2xl border border-slate-700 bg-gradient-to-br from-blue-950 to-[#101b30] p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400">
              <Headphones size={19} />
            </div>

            <h3 className="text-sm font-semibold">Need Help?</h3>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Our support team is here to help you with your VPS.
            </p>

            <button
              onClick={() => handleMenuClick("Support")}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold hover:bg-blue-500"
            >
              Contact Support
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        {/* Sidebar Bottom */}
        <div className="border-t border-slate-800 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
          >
            <LogOut size={19} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-h-screen lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-800 bg-[#080e1b]/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-800 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>

            <div>
              <h2 className="text-lg font-bold sm:text-xl">
                {activeMenu}
              </h2>
              <p className="hidden text-xs text-slate-500 sm:block">
                Manage your 24/7 account
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <button
              className="relative rounded-xl border border-slate-800 p-2.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              aria-label="Notifications"
            >
              <Bell size={19} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-500" />
            </button>

            <div className="flex items-center gap-3 border-l border-slate-800 pl-3 sm:pl-5">
              <div className="hidden text-right sm:block">
                <p className="max-w-40 truncate text-xs font-bold">
                  {profileLoading
                    ? "Loading..."
                    : profile?.name || "My Account"}
                </p>
                <p className="max-w-40 truncate text-[10px] text-slate-500">
                  {profile?.email || "Account"}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {/* Global VPS feedback */}
          {vpsMessage && (
            <div className="mb-5 rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm text-green-400">
              {vpsMessage}
            </div>
          )}

          {activeMenu === "Overview" ? (
            <>
              {/* Welcome Section */}
              <section className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-center">
                <div>
                  <p className="mb-2 text-sm text-blue-400">
                    Welcome
                    {profile?.name ? `, ${profile.name}` : " to 24/7"}
                  </p>

                  <h1 className="text-2xl font-bold sm:text-3xl">
                    Dashboard Overview
                  </h1>

                  <p className="mt-2 text-sm text-slate-400">
                    Manage your VPS, billing and account from one place.
                  </p>
                </div>

                <button
                  onClick={() => handleMenuClick("Buy VPS")}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold shadow-lg shadow-blue-900/20 transition hover:bg-blue-500"
                >
                  <Plus size={18} />
                  Deploy New VPS
                </button>
              </section>

              {/* Stats Cards */}
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <div
                      key={stat.title}
                      className="rounded-2xl border border-slate-800 bg-[#0d1627] p-5 transition hover:border-blue-500/40"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-400">
                            {stat.title}
                          </p>
                          <h3 className="mt-3 text-2xl font-bold">
                            {stat.value}
                          </h3>
                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                          <Icon size={23} />
                        </div>
                      </div>

                      <p className="mt-4 text-xs text-slate-500">
                        {stat.description}
                      </p>
                    </div>
                  );
                })}
              </section>

              {/* Quick Actions */}
              <section className="mt-8">
                <div className="mb-5">
                  <h2 className="text-lg font-bold">Quick Actions</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Frequently used account actions
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <button
                    onClick={() => handleMenuClick("Buy VPS")}
                    className="group flex items-center justify-between rounded-2xl border border-slate-800 bg-[#0d1627] p-5 text-left transition hover:border-blue-500/50 hover:bg-[#111e34]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                        <Server size={23} />
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold">
                          Deploy New VPS
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Get your new server
                        </p>
                      </div>
                    </div>

                    <ArrowUpRight
                      size={18}
                      className="text-slate-500 transition group-hover:text-blue-400"
                    />
                  </button>

                  <button
                    onClick={() => handleMenuClick("Wallet")}
                    className="group flex items-center justify-between rounded-2xl border border-slate-800 bg-[#0d1627] p-5 text-left transition hover:border-blue-500/50 hover:bg-[#111e34]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 text-green-400">
                        <Wallet size={23} />
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold">Add Funds</h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Manage your wallet balance
                        </p>
                      </div>
                    </div>

                    <ArrowUpRight
                      size={18}
                      className="text-slate-500 transition group-hover:text-green-400"
                    />
                  </button>

                  <button
                    onClick={() => handleMenuClick("Orders & Billing")}
                    className="group flex items-center justify-between rounded-2xl border border-slate-800 bg-[#0d1627] p-5 text-left transition hover:border-blue-500/50 hover:bg-[#111e34]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                        <Receipt size={23} />
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold">View Orders</h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Check your order history
                        </p>
                      </div>
                    </div>

                    <ArrowUpRight
                      size={18}
                      className="text-slate-500 transition group-hover:text-purple-400"
                    />
                  </button>
                </div>
              </section>

              {/* VPS Section */}
              <section className="mt-8">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold">My VPS Instances</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Overview of your cloud servers
                    </p>
                  </div>

                  <button
                    onClick={() => handleMenuClick("My VPS")}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300"
                  >
                    View All
                    <ChevronRight size={15} />
                  </button>
                </div>

                {vpsLoading ? (
                  <div className="rounded-2xl border border-slate-800 bg-[#0d1627] p-10 text-center">
                    <RefreshCw
                      className="mx-auto animate-spin text-blue-400"
                      size={28}
                    />
                    <p className="mt-3 text-sm text-slate-400">
                      Loading VPS instances...
                    </p>
                  </div>
                ) : vpsError ? (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
                    <p className="text-sm text-red-400">{vpsError}</p>
                    <button
                      onClick={fetchVps}
                      className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm"
                    >
                      Retry
                    </button>
                  </div>
                ) : vpsList.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800 bg-[#0d1627] px-5 py-12 text-center sm:px-8">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                      <Server size={30} />
                    </div>

                    <h3 className="mt-5 text-lg font-semibold">
                      No VPS Instances Found
                    </h3>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                      You haven't created any VPS yet. Deploy your first demo
                      virtual private server to get started with 24/7.
                    </p>

                    <button
                      onClick={() => handleMenuClick("Buy VPS")}
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
                    >
                      <Plus size={17} />
                      Deploy Demo VPS
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {vpsList.slice(0, 2).map(renderVpsCard)}
                  </div>
                )}
              </section>

              {/* Bottom Cards */}
              <section className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-2">
                {/* Account Information */}
                <div className="rounded-2xl border border-slate-800 bg-[#0d1627] p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                      <User size={20} />
                    </div>

                    <div>
                      <h2 className="font-bold">Account Information</h2>
                      <p className="text-xs text-slate-500">
                        Your personal account details
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-5">
                    <div className="rounded-xl border border-slate-700 bg-[#080e1b] p-4">
                      <p className="text-xs text-slate-500">Full Name</p>
                      <p className="mt-1 text-sm font-semibold">
                        {profileLoading
                          ? "Loading..."
                          : profile?.name || "Unavailable"}
                      </p>

                      <p className="mt-4 text-xs text-slate-500">
                        Email Address
                      </p>
                      <p className="mt-1 break-all text-sm font-semibold">
                        {profile?.email || "Unavailable"}
                      </p>

                      <p className="mt-4 text-xs text-slate-500">
                        Account Role
                      </p>
                      <p className="mt-1 text-sm font-semibold capitalize">
                        {profile?.role || "Unavailable"}
                      </p>

                      <p className="mt-4 text-xs text-slate-500">
                        Email Verification
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {profile?.emailVerifiedAt ? "Verified" : "Not verified"}
                      </p>

                      {profileError && (
                        <p className="mt-3 text-xs text-red-400">
                          {profileError}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-[#080e1b] p-4">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="text-green-400" size={20} />
                        <div>
                          <p className="text-sm font-semibold">
                            Account Status
                          </p>
                          <p className="text-xs text-slate-500">
                            Your account availability
                          </p>
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          profile?.isActive
                            ? "bg-green-500/10 text-green-400"
                            : "bg-slate-700 text-slate-400"
                        }`}
                      >
                        {profileLoading
                          ? "Loading"
                          : profile?.isActive
                            ? "Active"
                            : "Unavailable"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Resource Information */}
                <div className="rounded-2xl border border-slate-800 bg-[#0d1627] p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                      <Activity size={20} />
                    </div>

                    <div>
                      <h2 className="font-bold">Resource Overview</h2>
                      <p className="text-xs text-slate-500">
                        Your VPS resource information
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-5">
                    {[
                      { name: "CPU Usage", value: "No data", icon: Cpu },
                      {
                        name: "Memory Usage",
                        value: "No data",
                        icon: MemoryStick,
                      },
                      {
                        name: "Storage Usage",
                        value: "No data",
                        icon: HardDrive,
                      },
                      { name: "Network Usage", value: "No data", icon: Globe },
                    ].map((resource) => {
                      const Icon = resource.icon;

                      return (
                        <div key={resource.name}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                              <Icon size={17} className="text-slate-500" />
                              {resource.name}
                            </div>

                            <span className="text-xs text-slate-500">
                              {resource.value}
                            </span>
                          </div>

                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                            <div className="h-full w-0 rounded-full bg-blue-500" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                    <div className="flex items-start gap-3">
                      <Zap
                        size={19}
                        className="mt-0.5 shrink-0 text-blue-400"
                      />
                      <p className="text-xs leading-5 text-slate-400">
                        VPS resource monitoring will be available once your
                        server is connected to a real provider.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Account Security */}
              <section className="mt-8 rounded-2xl border border-slate-800 bg-[#0d1627] p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/10 text-green-400">
                      <ShieldCheck size={22} />
                    </div>

                    <div>
                      <h2 className="font-bold">Account Security</h2>
                      <p className="mt-1 text-xs text-slate-500">
                        Keep your 24/7 account secure.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleMenuClick("Settings")}
                    className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800"
                  >
                    Manage Settings
                    <ArrowUpRight size={15} />
                  </button>
                </div>
              </section>

              {/* Footer */}
              <footer className="mt-10 flex flex-col justify-between gap-3 border-t border-slate-800 pt-6 text-xs text-slate-500 sm:flex-row">
                <p>
                  © {new Date().getFullYear()} 24/7. All rights reserved.
                </p>
                <p>Powering your cloud infrastructure.</p>
              </footer>
            </>
          ) : activeMenu === "My VPS" ? (
            /* My VPS Page */
            <section>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">My VPS Instances</h1>
                  <p className="mt-2 text-sm text-slate-400">
                    Manage and control your cloud servers.
                  </p>
                </div>

                <button
                  onClick={fetchVps}
                  disabled={vpsLoading}
                  className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm transition hover:bg-slate-800 disabled:opacity-50"
                >
                  <RefreshCw
                    size={16}
                    className={vpsLoading ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              </div>

              {vpsError && (
                <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
                  {vpsError}
                </div>
              )}

              {vpsMessage && (
                <div className="mb-5 rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-sm text-green-400">
                  {vpsMessage}
                </div>
              )}

              {vpsLoading ? (
                <div className="rounded-2xl border border-slate-800 bg-[#0d1627] p-12 text-center">
                  <RefreshCw
                    size={28}
                    className="mx-auto animate-spin text-blue-400"
                  />
                  <p className="mt-3 text-sm text-slate-400">
                    Loading your VPS instances...
                  </p>
                </div>
              ) : vpsList.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-[#0d1627] p-10 text-center">
                  <Server size={35} className="mx-auto text-blue-400" />
                  <h2 className="mt-4 text-lg font-bold">No VPS Found</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    You don't have any VPS instances yet.
                  </p>
                  <button
                    onClick={() => handleMenuClick("Buy VPS")}
                    className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500"
                  >
                    <Plus size={16} className="mr-2 inline" />
                    Deploy Demo VPS
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  {vpsList.map(renderVpsCard)}
                </div>
              )}
            </section>
          ) : activeMenu === "Buy VPS" ? (
            /* Buy VPS Page */
            <section className="mx-auto max-w-3xl">
              <div className="rounded-2xl border border-slate-800 bg-[#0d1627] p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                    <Server size={25} />
                  </div>

                  <div>
                    <h1 className="text-xl font-bold">Deploy Demo VPS</h1>
                    <p className="text-xs text-slate-400">
                      24/7 demonstration environment
                    </p>
                  </div>
                </div>

                <div className="mt-7 rounded-xl border border-slate-700 bg-[#080e1b] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-semibold">
                      Demo VPS Configuration
                    </h2>
                    <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs text-yellow-400">
                      DEMO MODE
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-5 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">
                        Operating System
                      </p>
                      <p className="mt-1 font-semibold">Ubuntu 22.04</p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Memory</p>
                      <p className="mt-1 font-semibold">4 GB RAM</p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Provisioning</p>
                      <p className="mt-1 font-semibold">
                        Instant (Simulated)
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Validity</p>
                      <p className="mt-1 font-semibold">30 Days</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                  <p className="text-xs leading-5 text-yellow-400">
                    This is a simulated VPS for demonstration. It does not
                    create a real internet-accessible server and does not
                    charge your wallet.
                  </p>
                </div>

                {vpsError && (
                  <p className="mt-4 text-sm text-red-400">{vpsError}</p>
                )}

                <button
                  onClick={provisionDemoVps}
                  disabled={provisionLoading}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {provisionLoading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Provisioning...
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Deploy Demo VPS
                    </>
                  )}
                </button>
              </div>
            </section>
          ) : (
            /* Other Pages */
            <section className="rounded-2xl border border-slate-800 bg-[#0d1627] px-5 py-16 text-center sm:px-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                {activeMenu === "Wallet" && <Wallet size={30} />}
                {activeMenu === "Orders & Billing" && (
                  <CreditCard size={30} />
                )}
                {activeMenu === "Support" && <Headphones size={30} />}
                {activeMenu === "Settings" && <Settings size={30} />}
              </div>

              <h2 className="mt-5 text-xl font-bold">{activeMenu}</h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                This section is ready for the next development step. Its
                functionality will be connected to the 24/7 backend.
              </p>

              <button
                onClick={() => handleMenuClick("Overview")}
                className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500"
              >
                Back to Overview
              </button>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
