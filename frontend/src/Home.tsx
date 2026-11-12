
import { useState } from "react";
import {
  ArrowRight,
  ShieldCheck,
  Server,
  Zap,
  Globe,
  Headphones,
  LockKeyhole,
  CheckCircle2,
  Menu,
  X,
  Network,
  Monitor,
} from "lucide-react";

import logo from "./assets/247-logo.png";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

  const features = [
    {
      icon: Server,
      title: "VPS Management",
      desc: "Manage your virtual servers from one customer dashboard.",
    },
    {
      icon: Zap,
      title: "Quick Controls",
      desc: "Access supported server actions from your account.",
    },
    {
      icon: LockKeyhole,
      title: "Secure Account",
      desc: "Protected customer authentication and account access.",
    },
    {
      icon: Headphones,
      title: "Customer Support",
      desc: "Get help with your hosting services when you need it.",
    },
  ];

  const services = [
    {
      icon: Network,
      title: "Linux IP VPS",
      desc: "Explore Linux IP VPS services for your projects and applications.",
      link: "/buy-linux-ip",
      label: "Buy Linux IP",
    },
    {
      icon: Server,
      title: "VPS Hosting",
      desc: "Choose virtual private server hosting for your workloads.",
      link: "/buy-vps",
      label: "Buy VPS",
    },
    {
      icon: Monitor,
      title: "Software",
      desc: "Explore available software services and solutions.",
      link: "/buy-software",
      label: "Explore Software",
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#080e1b] text-white">

      {/* Navbar */}
      <nav className="relative z-50 bg-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 lg:px-10">

          {/* Logo */}
          <a href="/" onClick={closeMenu} className="flex shrink-0 items-center gap-2">
            <img
              src={logo}
              alt="24/7 Logo"
              className="h-12 w-12 rounded-full object-contain"
            />
            <span className="text-base font-extrabold tracking-tight text-slate-900 sm:text-xl">
              24/7 HR SERVICE EVERYDAY
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-7 text-sm font-semibold text-slate-700 lg:flex">
            <a href="/" className="transition hover:text-blue-600">
              Home
            </a>
            <a href="/buy-linux-ip" className="transition hover:text-blue-600">
              Buy IP
            </a>
            <a href="/buy-vps" className="transition hover:text-blue-600">
              Buy VPS
            </a>
            <a href="/buy-software" className="transition hover:text-blue-600">
              Buy Software
            </a>
            <a href="#about" className="transition hover:text-blue-600">
              About
            </a>
          </div>

          {/* Desktop Login */}
          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            <a
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:text-blue-600"
            >
              Login
            </a>
            <a
              href="/register"
              className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500"
            >
              Get Started
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-800 transition hover:bg-slate-100 lg:hidden"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-5 py-5 shadow-lg lg:hidden">
            <div className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
              <a onClick={closeMenu} href="/" className="rounded-lg px-4 py-3 hover:bg-slate-100">
                Home
              </a>
              <a onClick={closeMenu} href="/buy-linux-ip" className="rounded-lg px-4 py-3 hover:bg-slate-100">
                Buy Linux IP
              </a>
              <a onClick={closeMenu} href="/buy-vps" className="rounded-lg px-4 py-3 hover:bg-slate-100">
                Buy VPS
              </a>
              <a onClick={closeMenu} href="/buy-software" className="rounded-lg px-4 py-3 hover:bg-slate-100">
                Buy Software
              </a>
              <a onClick={closeMenu} href="#about" className="rounded-lg px-4 py-3 hover:bg-slate-100">
                About
              </a>

              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-200 pt-4">
                <a
                  onClick={closeMenu}
                  href="/login"
                  className="rounded-lg border border-slate-300 px-4 py-3 text-center font-bold"
                >
                  Login
                </a>
                <a
                  onClick={closeMenu}
                  href="/register"
                  className="rounded-lg bg-blue-600 px-4 py-3 text-center font-bold text-white"
                >
                  Get Started
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 pb-24 pt-16 lg:grid-cols-2 lg:px-10 lg:pb-32 lg:pt-24">

        <div className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-blue-600/15 blur-[130px]" />

        <div className="relative">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-xs font-semibold text-blue-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Reliable VPS Infrastructure
          </div>

          <h1 className="max-w-2xl text-5xl font-extrabold leading-[1.12] tracking-tight sm:text-6xl lg:text-7xl">
            Your Servers.
            <span className="block text-blue-400">Your Control.</span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-8 text-slate-400 sm:text-lg">
            Deploy and manage your virtual private servers from one simple
            dashboard. Get the flexibility, control and infrastructure your
            projects need.
          </p>

          {/* Hero Buttons */}
          <div className="mt-9 flex flex-wrap gap-4">
            <a
              href="/buy-vps"
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-7 py-4 text-sm font-bold transition hover:bg-blue-500"
            >
              Buy VPS <ArrowRight size={18} />
            </a>

            <a
              href="/buy-linux-ip"
              className="inline-flex items-center gap-2 rounded-full border border-blue-400/40 bg-blue-500/10 px-7 py-4 text-sm font-bold text-blue-300 transition hover:bg-blue-500/20"
            >
              <Globe size={18} /> Buy Linux IP
            </a>

            <a
              href="/login"
              className="rounded-full border border-slate-700 px-7 py-4 text-sm font-bold text-slate-200 transition hover:border-blue-400 hover:text-white"
            >
              Customer Login
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-400" />
              Easy Management
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-400" />
              Secure Access
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-400" />
              Flexible Hosting
            </span>
          </div>
        </div>

        {/* Server Visual */}
        <div className="relative mx-auto w-full max-w-lg">
          <div className="absolute inset-0 rounded-full bg-blue-600/15 blur-[100px]" />

          <div className="relative rounded-2xl border border-slate-700/80 bg-[#111a2b] p-6 shadow-2xl shadow-blue-950/30 sm:p-8">
            <div className="mb-7 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400">
                  INFRASTRUCTURE
                </p>
                <h2 className="mt-1 text-lg font-bold">Server Overview</h2>
              </div>

              <div className="rounded-xl bg-blue-500/15 p-3 text-blue-400">
                <Server size={25} />
              </div>
            </div>

            <div className="space-y-4">
              {["Compute Resources", "Network Connectivity", "Server Security"].map(
                (item, index) => (
                  <div
                    key={item}
                    className="flex items-center gap-4 rounded-xl border border-slate-700/70 bg-[#080e1b] p-4"
                  >
                    <div className="rounded-lg bg-blue-500/10 p-3 text-blue-400">
                      {index === 0 ? (
                        <Zap size={20} />
                      ) : index === 1 ? (
                        <Globe size={20} />
                      ) : (
                        <ShieldCheck size={20} />
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-semibold">{item}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Managed from one dashboard
                      </p>
                    </div>

                    <CheckCircle2 size={18} className="text-emerald-400" />
                  </div>
                )
              )}
            </div>

            <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
              <p className="text-xs text-blue-300">
                YOUR INFRASTRUCTURE, SIMPLIFIED
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Manage your VPS services with a straightforward customer
                experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="border-y border-slate-800 bg-[#0c1424] px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[3px] text-blue-400">
              Our Services
            </p>
            <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
              Choose the service you need
            </h2>
            <p className="mt-4 leading-7 text-slate-400">
              Explore our available hosting and software services.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {services.map(({ icon: Icon, title, desc, link, label }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-800 bg-[#111a2b] p-7 transition hover:-translate-y-1 hover:border-blue-500/50"
              >
                <div className="mb-5 inline-flex rounded-xl bg-blue-500/10 p-3 text-blue-400">
                  <Icon size={25} />
                </div>

                <h3 className="text-xl font-bold">{title}</h3>
                <p className="mt-3 min-h-14 text-sm leading-6 text-slate-400">
                  {desc}
                </p>

                <a
                  href={link}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-400 transition hover:text-blue-300"
                >
                  {label} <ArrowRight size={17} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[3px] text-blue-400">
              Why 24/7
            </p>
            <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
              Everything you need to manage your VPS
            </h2>
            <p className="mt-4 leading-7 text-slate-400">
              A simple platform designed to help you manage your hosting
              services.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-slate-800 bg-[#111a2b] p-6 transition hover:-translate-y-1 hover:border-blue-500/50"
              >
                <div className="mb-5 inline-flex rounded-xl bg-blue-500/10 p-3 text-blue-400">
                  <Icon size={23} />
                </div>
                <h3 className="text-base font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="border-y border-slate-800 bg-[#0c1424] px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-[3px] text-blue-400">
            About 24/7
          </p>
          <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
            Your infrastructure, managed simply
          </h2>
          <p className="mx-auto mt-5 max-w-2xl leading-8 text-slate-400">
            24/7 brings hosting services and server management into one
            convenient platform. Explore services, manage your account and
            access your hosting dashboard in one place.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-700 bg-[#111a2b] p-8 text-center sm:p-12">
          <Server size={34} className="mx-auto text-blue-400" />
          <h2 className="mt-5 text-3xl font-extrabold">
            Ready to get started?
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-400">
            Explore our services and find the right solution for your needs.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="/buy-linux-ip"
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-7 py-3.5 text-sm font-bold transition hover:bg-blue-500"
            >
              Buy Linux IP <ArrowRight size={17} />
            </a>
            <a
              href="/buy-vps"
              className="inline-flex items-center gap-2 rounded-full border border-slate-600 px-7 py-3.5 text-sm font-bold transition hover:border-blue-400"
            >
              Buy VPS
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="support" className="border-t border-slate-800 px-6 py-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <a href="/" className="flex items-center gap-2">
            <img
              src={logo}
              alt="24/7 Logo"
              className="h-9 w-9 rounded-full object-contain"
            />
            <span className="text-lg font-extrabold">
              24<span className="text-blue-400">/7</span>
            </span>
          </a>

          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} 24/7. All rights reserved.
          </p>

          <a
            href="/login"
            className="text-xs text-slate-400 transition hover:text-blue-400"
          >
            Customer Login
          </a>
        </div>
      </footer>
    </main>
  );
}
