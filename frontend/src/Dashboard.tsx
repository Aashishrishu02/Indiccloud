import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight, ArrowUpRight, Cpu, CreditCard, HardDrive, Headphones,
  LockKeyhole, Menu, Monitor, RefreshCw, Server, ShieldCheck, Wallet, X, Zap,
} from "lucide-react";
import api from "./api";
import logo from "./assets/247-logo.png";

type UserProfile = {
  id: string; name: string; email: string; role: string;
  emailVerifiedAt: string | null; isActive: boolean; createdAt: string;
};
type VPSInstance = {
  id: string; userId: string; provider: string; ipAddress: string;
  hostname: string | null; operatingSystem: string | null; ram: number | null;
  status: string; expiresAt: string | null; createdAt: string;
};
type VPSPlan = {
  id: string; name: string; productType: "VPS_HOSTING" | "LINUX_IP_VPS";
  description?: string | null; cpuCores?: number | null; ramGb?: number | null;
  storageGb?: number | null; bandwidthGb?: number | null; price: number | string;
  currency?: string; durationDays?: number; supportedOS?: string[];
  isActive?: boolean; sortOrder?: number;
};
type Page = "Home" | "Windows VPS" | "Linux VPS" | "My VPS" | "Wallet" | "Orders" | "Support";

const navItems: { label: Page; short: string }[] = [
  { label: "Home", short: "Home" },
  { label: "Windows VPS", short: "Windows VPS" },
  { label: "Linux VPS", short: "Linux VPS" },
  { label: "My VPS", short: "My Servers" },
  { label: "Wallet", short: "Wallet" },
  { label: "Orders", short: "Orders" },
  { label: "Support", short: "Support" },
];
const money = (value: number | string, currency = "INR") => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Price on request";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
};

export default function Dashboard() {
  const [page, setPage] = useState<Page>("Home");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [vpsList, setVpsList] = useState<VPSInstance[]>([]);
  const [plans, setPlans] = useState<VPSPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(true);
  const [error, setError] = useState("");
  const [plansError, setPlansError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<VPSPlan | null>(null);
  const [selectedOS, setSelectedOS] = useState("");
  const [coupon, setCoupon] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"WALLET" | "RAZORPAY">("RAZORPAY");

  const fetchProfile = useCallback(async () => {
    try {
      const token = sessionStorage.getItem("indiccloud_token");
      if (!token) { window.location.href = "/login"; return; }
      const response = await api.get("/profile");
      setProfile(response.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        sessionStorage.removeItem("indiccloud_token"); window.location.href = "/login"; return;
      }
    }
  }, []);
  const fetchVps = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const response = await api.get("/vps");
      setVpsList(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      if (err.response?.status === 401) {
        sessionStorage.removeItem("indiccloud_token"); window.location.href = "/login"; return;
      }
      setError(err.response?.data?.message || "Unable to load your servers.");
    } finally { setLoading(false); }
  }, []);
  const fetchPlans = useCallback(async () => {
    try {
      setPlansLoading(true); setPlansError("");
      // Customer catalogue endpoint; the backend must expose active plans here.
      const response = await api.get("/plans");
      const rows = Array.isArray(response.data) ? response.data : response.data?.plans;
      setPlans(Array.isArray(rows) ? rows.filter((plan: VPSPlan) => plan.isActive !== false) : []);
    } catch (err: any) {
      setPlans([]);
      setPlansError(err.response?.data?.message || "Plans are not available yet. Please check back shortly.");
    } finally { setPlansLoading(false); }
  }, []);
  useEffect(() => { void fetchProfile(); void fetchVps(); void fetchPlans(); }, [fetchProfile, fetchVps, fetchPlans]);

  const handleVpsAction = async (id: string, action: "start" | "stop") => {
    try {
      setActionLoading(id); setError(""); setNotice("");
      const response = await api.post(`/vps/${id}/${action}`);
      setNotice(response.data?.message || `Server ${action} request completed.`);
      await fetchVps();
    } catch (err: any) { setError(err.response?.data?.message || `Unable to ${action} this server.`); }
    finally { setActionLoading(null); }
  };
  const logout = () => { sessionStorage.removeItem("indiccloud_token"); window.location.href = "/login"; };
  const go = (next: Page) => { setPage(next); setMobileMenu(false); setNotice(""); setError(""); };
  const openCheckout = (plan: VPSPlan) => {
    setSelectedPlan(plan); setSelectedOS(plan.supportedOS?.[0] || "Ubuntu 22.04"); setCoupon("");
  };
  const activeCount = vpsList.filter((v) => v.status === "RUNNING").length;
  const visiblePlans = useMemo(() => plans.filter((plan) => {
    if (page === "Windows VPS") return plan.supportedOS?.some((os) => os.toLowerCase().includes("windows"));
    if (page === "Linux VPS") return plan.productType === "LINUX_IP_VPS" || plan.supportedOS?.some((os) => !os.toLowerCase().includes("windows"));
    return true;
  }), [plans, page]);

  const PlanCard = ({ plan, index }: { plan: VPSPlan; index: number }) => {
    const availableOS = plan.supportedOS || [];
    return (
      <article className={`group relative overflow-hidden rounded-2xl border bg-[#0b1531]/90 p-5 shadow-[0_16px_50px_rgba(0,0,0,.22)] transition duration-300 hover:-translate-y-1 hover:border-cyan-400/70 ${index === 1 ? "border-cyan-400/60" : "border-blue-900/70"}`}>
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-500 via-cyan-300 to-blue-600" />
        {index === 1 && <span className="absolute right-4 top-4 rounded-full bg-cyan-300/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-200">Popular</span>}
        <div className="flex items-start justify-between gap-3 pr-16">
          <div className="flex items-center gap-2 text-cyan-100"><Monitor size={18}/><span className="text-xs font-semibold uppercase tracking-wider">{plan.productType === "LINUX_IP_VPS" ? "Linux IP VPS" : "Windows / VPS"}</span></div>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">Available</span>
        </div>
        <h3 className="mt-4 min-h-12 text-lg font-extrabold leading-snug text-white">{plan.name}</h3>
        {plan.description && <p className="mt-1 line-clamp-2 min-h-8 text-xs leading-5 text-slate-400">{plan.description}</p>}
        <div className="mt-5 space-y-3 border-y border-blue-900/60 py-4 text-sm text-slate-200">
          <div className="flex items-center gap-3"><Cpu size={16} className="text-cyan-300"/><span>{plan.cpuCores ?? "—"} vCPU Cores</span></div>
          <div className="flex items-center gap-3"><Zap size={16} className="text-cyan-300"/><span>{plan.ramGb ?? "—"} GB RAM</span></div>
          <div className="flex items-center gap-3"><HardDrive size={16} className="text-cyan-300"/><span>{plan.storageGb ?? "—"} GB SSD Storage</span></div>
          <div className="flex items-center gap-3"><ArrowUpRight size={16} className="text-cyan-300"/><span>{plan.bandwidthGb ?? "—"} GB Bandwidth</span></div>
          <div className="flex items-center gap-3"><ShieldCheck size={16} className="text-cyan-300"/><span>Full control panel & support</span></div>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">{availableOS.slice(0, 3).map((os) => <span key={os} className="rounded-md bg-blue-950/80 px-2 py-1 text-[10px] text-blue-200">{os}</span>)}</div>
        <div className="mt-5 flex items-end justify-between gap-3">
          <div><p className="text-[10px] uppercase tracking-wider text-slate-500">Starting from</p><p className="mt-1 text-2xl font-black text-white">{money(plan.price, plan.currency || "INR")}<span className="ml-1 text-xs font-medium text-slate-400">/ {plan.durationDays === 30 ? "mo" : `${plan.durationDays || 30} days`}</span></p></div>
          <button onClick={() => openCheckout(plan)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-300 px-4 py-3 text-xs font-extrabold text-[#06132d] shadow-lg shadow-cyan-500/20 transition hover:brightness-110">Buy Now <ArrowRight size={15}/></button>
        </div>
      </article>
    );
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050b20] text-white selection:bg-cyan-300 selection:text-[#06132d]">
      <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(ellipse_at_50%_-15%,rgba(21,88,220,.28),transparent_48%),radial-gradient(ellipse_at_100%_60%,rgba(8,74,155,.12),transparent_35%)]" />
      <header className="sticky top-0 z-40 border-b border-blue-900/50 bg-[#050b20]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-10">
          <button onClick={() => go("Home")} className="flex items-center gap-3 text-left">
            <img src={logo} alt="24/7" className="h-10 w-10 rounded-xl object-contain"/>
            <span><span className="block text-lg font-black tracking-wide">24/7 <span className="text-cyan-300">HR SERVICE</span></span><span className="block text-[9px] tracking-[.28em] text-slate-500">VPS HOSTING</span></span>
          </button>
          <nav className="hidden items-center gap-1 lg:flex">{navItems.map((item) => <button key={item.label} onClick={() => go(item.label)} className={`rounded-full px-3 py-2 text-xs font-semibold transition ${page === item.label ? "bg-blue-500/15 text-cyan-200" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}>{item.short}</button>)}</nav>
          <div className="hidden items-center gap-3 sm:flex">
            <div className="text-right"><p className="text-xs font-bold">{profile?.name || "My Account"}</p><p className="max-w-40 truncate text-[10px] text-slate-500">{profile?.email || ""}</p></div>
            <button onClick={logout} className="rounded-full border border-blue-800/80 px-4 py-2 text-xs font-bold text-slate-200 transition hover:border-cyan-300 hover:text-cyan-200">Logout</button>
          </div>
          <button onClick={() => setMobileMenu((v) => !v)} className="rounded-lg border border-blue-900 p-2 lg:hidden" aria-label="Toggle navigation">{mobileMenu ? <X size={20}/> : <Menu size={20}/>}</button>
        </div>
        {mobileMenu && <nav className="grid grid-cols-2 gap-2 border-t border-blue-900/50 px-4 py-3 sm:grid-cols-3 lg:hidden">{navItems.map((item) => <button key={item.label} onClick={() => go(item.label)} className={`rounded-lg px-3 py-3 text-left text-sm ${page === item.label ? "bg-blue-600 text-white" : "bg-white/5 text-slate-300"}`}>{item.short}</button>)}<button onClick={logout} className="rounded-lg bg-red-500/10 px-3 py-3 text-left text-sm text-red-300">Logout</button></nav>}
      </header>

      <main className="relative z-10 mx-auto max-w-[1440px] px-4 pb-16 sm:px-6 lg:px-10">
        {notice && <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{notice}</div>}
        {error && <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

        {(page === "Home" || page === "Windows VPS" || page === "Linux VPS") && <>
          {page === "Home" && <section className="relative mt-7 overflow-hidden rounded-[28px] border border-blue-700/50 bg-[linear-gradient(112deg,#07184a_0%,#092d82_48%,#071c50_100%)] px-6 py-14 text-center shadow-[0_25px_90px_rgba(0,48,160,.24)] sm:mt-9 sm:px-12 sm:py-20">
            <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl"/><div className="pointer-events-none absolute -right-12 bottom-0 h-72 w-72 rounded-full bg-cyan-300/15 blur-3xl"/>
            <div className="relative mx-auto max-w-3xl"><span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-200/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[.2em] text-cyan-100"><Zap size={13}/> High performance cloud servers</span>
              <h1 className="mt-6 text-4xl font-black leading-[1.08] tracking-tight sm:text-6xl">Your Windows VPS<br/><span className="bg-gradient-to-r from-cyan-200 to-sky-400 bg-clip-text text-transparent">Starts Here.</span></h1>
              <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-blue-100/80 sm:text-base">High performance VPS hosting with instant delivery, reliable uptime and full control. Choose your server and get started in minutes.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3"><button onClick={() => go("Windows VPS")} className="rounded-xl bg-cyan-300 px-6 py-3.5 text-sm font-extrabold text-[#071638] shadow-xl shadow-cyan-500/20 transition hover:bg-cyan-200">Buy VPS <ArrowRight className="ml-2 inline" size={16}/></button><button onClick={() => go("Linux VPS")} className="rounded-xl border border-white/30 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10">Explore Linux VPS</button><button onClick={() => go("My VPS")} className="rounded-xl border border-white/30 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10">My Servers</button></div>
              <div className="mt-12 grid grid-cols-2 gap-5 border-t border-white/15 pt-7 sm:grid-cols-4"><div><p className="text-2xl font-black">99.9%</p><p className="mt-1 text-[10px] uppercase tracking-wider text-blue-200">Network uptime target</p></div><div><p className="text-2xl font-black">SSD</p><p className="mt-1 text-[10px] uppercase tracking-wider text-blue-200">Fast storage</p></div><div><p className="text-2xl font-black">24/7</p><p className="mt-1 text-[10px] uppercase tracking-wider text-blue-200">Support</p></div><div><p className="text-2xl font-black">Secure</p><p className="mt-1 text-[10px] uppercase tracking-wider text-blue-200">Payment flow</p></div></div>
            </div>
          </section>}
          <section className="pt-12 sm:pt-14"><div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[.24em] text-cyan-300">Choose your server</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">{page === "Home" ? "Explore VPS Plans" : page === "Windows VPS" ? "Windows VPS Plans" : "Linux VPS Plans"}</h2><p className="mt-2 text-sm text-slate-400">All plans include full control panel, SSD storage and 24×7 support.</p></div><div className="flex gap-2"><button onClick={() => go("Windows VPS")} className={`rounded-full border px-4 py-2 text-xs font-bold ${page === "Windows VPS" ? "border-cyan-300 bg-cyan-300/10 text-cyan-100" : "border-blue-900 text-slate-300"}`}>Windows</button><button onClick={() => go("Linux VPS")} className={`rounded-full border px-4 py-2 text-xs font-bold ${page === "Linux VPS" ? "border-cyan-300 bg-cyan-300/10 text-cyan-100" : "border-blue-900 text-slate-300"}`}>Linux</button></div></div>
            {plansLoading ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map((i)=><div key={i} className="h-[390px] animate-pulse rounded-2xl border border-blue-900 bg-[#0b1531]"/>)}</div> : visiblePlans.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{visiblePlans.map((plan,index)=><PlanCard key={plan.id} plan={plan} index={index}/>)}</div> : <div className="rounded-2xl border border-blue-900/70 bg-[#0b1531]/80 px-6 py-12 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-cyan-300"><Server size={26}/></div><h3 className="mt-4 text-lg font-bold">VPS plans will appear here</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-400">{plansError || "Our team is updating the available server plans. Please check again shortly."}</p><button onClick={fetchPlans} className="mt-5 inline-flex items-center gap-2 rounded-lg border border-blue-800 px-4 py-2 text-xs font-bold text-cyan-200 hover:bg-blue-900/40"><RefreshCw size={14}/> Refresh plans</button></div>}
          </section>
          <section className="mt-12 grid gap-4 rounded-2xl border border-blue-900/60 bg-[#08132d]/80 p-6 sm:grid-cols-3 sm:p-8"><div className="flex gap-3"><ShieldCheck className="shrink-0 text-cyan-300"/><div><h3 className="text-sm font-bold">Secure & reliable</h3><p className="mt-1 text-xs leading-5 text-slate-400">Protected customer account and verified payment flow.</p></div></div><div className="flex gap-3"><Zap className="shrink-0 text-cyan-300"/><div><h3 className="text-sm font-bold">Fast deployment</h3><p className="mt-1 text-xs leading-5 text-slate-400">Order processing and server provisioning status in one place.</p></div></div><div className="flex gap-3"><Headphones className="shrink-0 text-cyan-300"/><div><h3 className="text-sm font-bold">24/7 assistance</h3><p className="mt-1 text-xs leading-5 text-slate-400">Get help with billing, setup and server operations.</p></div></div></section>
        </>}

        {page === "My VPS" && <section className="pt-10"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-cyan-300">Customer area</p><h1 className="mt-2 text-3xl font-black">My Servers</h1><p className="mt-2 text-sm text-slate-400">Manage your VPS instances and server status.</p></div><button onClick={fetchVps} className="inline-flex items-center gap-2 rounded-xl border border-blue-800 px-4 py-3 text-xs font-bold text-cyan-200"><RefreshCw size={15}/> Refresh</button></div><div className="mt-7 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-blue-900 bg-[#0b1531] p-5"><p className="text-xs text-slate-400">Total servers</p><p className="mt-2 text-3xl font-black">{vpsList.length}</p></div><div className="rounded-2xl border border-blue-900 bg-[#0b1531] p-5"><p className="text-xs text-slate-400">Running</p><p className="mt-2 text-3xl font-black text-emerald-300">{activeCount}</p></div><div className="rounded-2xl border border-blue-900 bg-[#0b1531] p-5"><p className="text-xs text-slate-400">Stopped / Other</p><p className="mt-2 text-3xl font-black">{vpsList.length-activeCount}</p></div></div>{loading ? <p className="py-12 text-center text-sm text-slate-400">Loading servers…</p> : vpsList.length ? <div className="mt-6 grid gap-4 lg:grid-cols-2">{vpsList.map((vps)=><article key={vps.id} className="rounded-2xl border border-blue-900/70 bg-[#0b1531] p-5"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="rounded-xl bg-blue-500/15 p-3 text-cyan-300"><Server size={20}/></div><div><h3 className="font-bold">{vps.hostname || "VPS Server"}</h3><p className="text-xs text-slate-500">{vps.provider}</p></div></div><span className={`rounded-full px-3 py-1 text-[10px] font-bold ${vps.status === "RUNNING" ? "bg-emerald-400/10 text-emerald-300" : "bg-slate-700 text-slate-300"}`}>{vps.status}</span></div><div className="mt-5 grid grid-cols-2 gap-4 border-y border-blue-900/60 py-4 text-sm"><div><p className="text-[10px] text-slate-500">IP ADDRESS</p><p className="mt-1 font-semibold text-cyan-200">{vps.ipAddress}</p></div><div><p className="text-[10px] text-slate-500">OPERATING SYSTEM</p><p className="mt-1">{vps.operatingSystem || "—"}</p></div><div><p className="text-[10px] text-slate-500">MEMORY</p><p className="mt-1">{vps.ram ?? "—"} GB RAM</p></div><div><p className="text-[10px] text-slate-500">EXPIRES</p><p className="mt-1">{vps.expiresAt ? new Date(vps.expiresAt).toLocaleDateString() : "—"}</p></div></div><button disabled={actionLoading === vps.id} onClick={()=>handleVpsAction(vps.id,vps.status === "RUNNING" ? "stop" : "start")} className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-50 ${vps.status === "RUNNING" ? "bg-red-500/10 text-red-300 hover:bg-red-500/20" : "bg-emerald-500 text-[#031a16] hover:bg-emerald-400"}`}>{actionLoading === vps.id ? <RefreshCw size={16} className="animate-spin"/> : <Zap size={16}/>} {vps.status === "RUNNING" ? "Stop Server" : "Start Server"}</button></article>)}</div> : <div className="mt-7 rounded-2xl border border-blue-900 bg-[#0b1531] p-12 text-center"><Server className="mx-auto text-cyan-300" size={34}/><h3 className="mt-4 text-lg font-bold">No VPS servers yet</h3><p className="mt-2 text-sm text-slate-400">Choose a plan to get your first server.</p><button onClick={()=>go("Windows VPS")} className="mt-5 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-extrabold text-[#06132d]">Browse VPS Plans</button></div>}</section>}

        {page === "Wallet" && <section className="mx-auto max-w-3xl pt-12"><p className="text-xs font-bold uppercase tracking-[.22em] text-cyan-300">Billing</p><h1 className="mt-2 text-3xl font-black">My Wallet</h1><div className="mt-7 rounded-3xl border border-blue-700/60 bg-gradient-to-br from-blue-800 to-[#071b48] p-8"><Wallet className="text-cyan-200" size={28}/><p className="mt-5 text-sm text-blue-100">Available balance</p><p className="mt-1 text-4xl font-black">₹0.00</p><p className="mt-3 text-xs text-blue-200/70">Wallet balance integration will appear once the wallet API is enabled.</p></div></section>}
        {page === "Orders" && <section className="pt-12"><p className="text-xs font-bold uppercase tracking-[.22em] text-cyan-300">Billing history</p><h1 className="mt-2 text-3xl font-black">Orders & Billing</h1><div className="mt-7 rounded-2xl border border-blue-900 bg-[#0b1531] p-10 text-center"><CreditCard className="mx-auto text-cyan-300" size={32}/><h3 className="mt-4 font-bold">Your orders will appear here</h3><p className="mt-2 text-sm text-slate-400">Order history and invoices are being connected to the customer API.</p></div></section>}
        {page === "Support" && <section className="mx-auto max-w-3xl pt-12"><p className="text-xs font-bold uppercase tracking-[.22em] text-cyan-300">We are here to help</p><h1 className="mt-2 text-3xl font-black">24/7 Customer Support</h1><div className="mt-7 rounded-2xl border border-blue-900 bg-[#0b1531] p-7"><Headphones className="text-cyan-300" size={30}/><h3 className="mt-4 text-lg font-bold">Need help with your VPS?</h3><p className="mt-2 text-sm leading-6 text-slate-400">Contact our support team for assistance with orders, payments and server management.</p><a href="mailto:support@247hrservice.com" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-extrabold text-[#06132d]">Contact Support <ArrowUpRight size={16}/></a></div></section>}
      </main>

      <footer className="relative z-10 border-t border-blue-900/50 bg-[#04091a]"><div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-4 px-4 py-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:px-6 lg:px-10"><div className="flex items-center gap-2"><img src={logo} alt="24/7" className="h-7 w-7 object-contain"/><span>© {new Date().getFullYear()} 24/7 HR Service. All rights reserved.</span></div><div className="flex flex-wrap gap-4"><button onClick={()=>go("Support")} className="hover:text-cyan-200">Contact</button><button onClick={()=>go("Wallet")} className="hover:text-cyan-200">Wallet</button><button onClick={()=>go("My VPS")} className="hover:text-cyan-200">My Servers</button></div></div></footer>

      {selectedPlan && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#020617]/85 p-3 backdrop-blur-md sm:p-6" onMouseDown={(e)=>{if(e.target===e.currentTarget)setSelectedPlan(null);}}><div className="my-auto w-full max-w-xl overflow-hidden rounded-3xl border border-cyan-300/30 bg-[#0a1430] shadow-[0_25px_100px_rgba(0,0,0,.65)]"><div className="flex items-start justify-between border-b border-blue-900/70 px-5 py-5 sm:px-7"><div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-cyan-300">Windows / Linux VPS · Checkout</p><h2 className="mt-1 text-2xl font-black">Complete Your Order</h2><p className="mt-1 text-xs text-slate-400">Review your server configuration and payment option.</p></div><button onClick={()=>setSelectedPlan(null)} className="rounded-lg border border-blue-900 p-2 text-slate-400 hover:text-white" aria-label="Close checkout"><X size={18}/></button></div><div className="space-y-5 p-5 sm:p-7"><div className="rounded-2xl border border-blue-900 bg-[#101e43] p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] uppercase tracking-wider text-slate-400">Selected plan</p><h3 className="mt-1 font-bold">{selectedPlan.name}</h3></div><span className="rounded-full bg-emerald-400/10 px-3 py-1 text-[10px] font-bold text-emerald-300">Available</span></div><div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-300"><span>{selectedPlan.cpuCores ?? "—"} vCPU</span><span>{selectedPlan.ramGb ?? "—"} GB RAM</span><span>{selectedPlan.storageGb ?? "—"} GB SSD</span><span>{selectedPlan.bandwidthGb ?? "—"} GB bandwidth</span></div></div><div><label className="mb-2 block text-xs font-bold text-slate-300">Select Operating System</label><select value={selectedOS} onChange={(e)=>setSelectedOS(e.target.value)} className="w-full rounded-xl border border-blue-800 bg-[#07122c] px-4 py-3 text-sm text-white outline-none focus:border-cyan-300">{(selectedPlan.supportedOS?.length ? selectedPlan.supportedOS : ["Ubuntu 22.04"]).map((os)=><option key={os} value={os}>{os}</option>)}</select></div><div className="flex gap-2"><input value={coupon} onChange={(e)=>setCoupon(e.target.value)} placeholder="Coupon code (optional)" className="min-w-0 flex-1 rounded-xl border border-blue-800 bg-[#07122c] px-4 py-3 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-300"/><button disabled className="rounded-xl border border-blue-700 px-5 text-xs font-bold text-slate-500" title="Coupon API is not connected yet">Apply</button></div><div><p className="mb-3 text-xs font-bold text-slate-300">Select Payment Method</p><div className="grid grid-cols-2 gap-3"><button onClick={()=>setPaymentMethod("WALLET")} className={`rounded-xl border p-4 text-left ${paymentMethod === "WALLET" ? "border-cyan-300 bg-cyan-300/10" : "border-blue-900 bg-[#07122c]"}`}><Wallet size={19} className="text-cyan-300"/><p className="mt-2 text-sm font-bold">Wallet Pay</p><p className="mt-1 text-[10px] text-slate-500">Use available balance</p></button><button onClick={()=>setPaymentMethod("RAZORPAY")} className={`rounded-xl border p-4 text-left ${paymentMethod === "RAZORPAY" ? "border-cyan-300 bg-cyan-300/10" : "border-blue-900 bg-[#07122c]"}`}><CreditCard size={19} className="text-cyan-300"/><p className="mt-2 text-sm font-bold">Razorpay</p><p className="mt-1 text-[10px] text-slate-500">UPI · Cards · Netbanking</p></button></div></div><div className="rounded-2xl border border-blue-900 bg-[#101e43] p-4"><div className="flex items-center justify-between text-xs text-slate-400"><span>Original price</span><span>{money(selectedPlan.price, selectedPlan.currency || "INR")}</span></div><div className="mt-3 flex items-center justify-between"><span className="text-sm font-bold">Total Payable</span><span className="text-2xl font-black text-cyan-200">{money(selectedPlan.price, selectedPlan.currency || "INR")}<span className="ml-1 text-[10px] font-medium text-slate-400">/ {selectedPlan.durationDays === 30 ? "mo" : `${selectedPlan.durationDays || 30} days`}</span></span></div></div><button disabled className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-300 px-5 py-4 text-sm font-black text-[#06132d] opacity-60" title="Payment will be enabled after backend order and payment verification APIs are connected">{paymentMethod === "WALLET" ? <Wallet size={17}/> : <LockKeyhole size={17}/>} Payment integration pending</button><p className="text-center text-[10px] leading-5 text-slate-500">No payment will be collected until secure backend order creation and payment verification are connected.</p></div></div></div>}
    </div>
  );
}
