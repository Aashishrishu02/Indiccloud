
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  LockKeyhole,
  Mail,
  Eye,
  EyeOff,
  Server,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import api from "./api";

type Screen = "login" | "register" | "verify";

function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    otp: "",
  });

  const update = (field: string, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const resetMessages = () => {
    setError("");
    setMessage("");
  };

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const response = await api.post("/login", {
        email: form.email,
        password: form.password,
      });

      sessionStorage.setItem("indiccloud_token", response.data.token);
      setMessage("Login successful!");

      // Dashboard route will be connected in the next step.
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Unable to login. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const validation = await api.post("/register/validate", {
        email: form.email,
      });

      if (validation.data.emailTaken) {
        setError("This email is already registered.");
        return;
      }

      await api.post("/register/initiate-verification", {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      setScreen("verify");
      setMessage("Verification OTP has been sent to your email.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      await api.post("/register/complete-registration", {
        email: form.email,
        otp: form.otp,
      });

      setMessage("Account created successfully. Please login.");
      setScreen("login");
      update("password", "");
      update("otp", "");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    resetMessages();
    setLoading(true);

    try {
      await api.post("/register/resend-otp", {
        email: form.email,
      });
      setMessage("A new OTP has been sent.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-slate-700 bg-[#080e1b] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15";

  const labelClass =
    "mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400";

  const primaryButton =
    "flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080e1b] px-4 py-10 text-white">
      <div className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px]" />

      <div className="relative z-10 w-full max-w-[470px]">
        <div className="mb-7 flex items-center justify-between">
          <a href="/" className="text-xl font-extrabold tracking-tight">
            Indic<span className="text-blue-400">Cloud</span>
          </a>

          <span className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            <ShieldCheck size={14} />
            Secure Infrastructure
          </span>
        </div>

        <div className="rounded-2xl border border-slate-700/70 bg-[#111a2b]/95 p-6 shadow-2xl shadow-black/30 sm:p-9">
          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
              {screen === "verify" ? (
                <Mail size={23} />
              ) : (
                <Server size={23} />
              )}
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[2px] text-emerald-400">
                Sovereign Cloud
              </p>
              <h1 className="mt-1 text-xl font-bold">
                {screen === "login" && "Console Access"}
                {screen === "register" && "Create Account"}
                {screen === "verify" && "Email Verification"}
              </h1>
            </div>
          </div>

          {screen === "login" && (
            <>
              <div className="mb-7 grid grid-cols-2 rounded-lg bg-[#080e1b] p-1">
                <button className="rounded-md bg-blue-600 py-2.5 text-xs font-bold text-white">
                  Sign In
                </button>
                <button
                  onClick={() => {
                    resetMessages();
                    setScreen("register");
                  }}
                  className="rounded-md py-2.5 text-xs font-bold text-slate-400 transition hover:text-white"
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={login} className="space-y-5">
                <div>
                  <label className={labelClass}>Work Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                    <input
                      className={`${inputClass} pl-11`}
                      type="email"
                      placeholder="you@company.com"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex justify-between">
                    <label className={labelClass}>Password</label>
                    <button
                      type="button"
                      onClick={() => setError("Password recovery will be added in the next authentication step.")}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <div className="relative">
                    <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                    <input
                      className={`${inputClass} pl-11 pr-12`}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={(e) => update("password", e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                    {error}
                  </p>
                )}

                {message && (
                  <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                    {message}
                  </p>
                )}

                <button className={primaryButton} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" size={18} /> : "Authenticate Session"}
                  {!loading && <ArrowRight size={17} />}
                </button>
              </form>
            </>
          )}

          {screen === "register" && (
            <>
              <button
                onClick={() => {
                  resetMessages();
                  setScreen("login");
                }}
                className="mb-6 flex items-center gap-2 text-xs text-slate-400 hover:text-white"
              >
                <ArrowLeft size={15} /> Back to Login
              </button>

              <form onSubmit={register} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>First Name</label>
                    <input
                      className={inputClass}
                      placeholder="First name"
                      value={form.firstName}
                      onChange={(e) => update("firstName", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Last Name</label>
                    <input
                      className={inputClass}
                      placeholder="Last name"
                      value={form.lastName}
                      onChange={(e) => update("lastName", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Work Email</label>
                  <input
                    className={inputClass}
                    type="email"
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Password</label>
                  <input
                    className={inputClass}
                    type="password"
                    placeholder="Create a password"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Confirm Password</label>
                  <input
                    className={inputClass}
                    type="password"
                    placeholder="Confirm your password"
                    value={form.confirmPassword}
                    onChange={(e) => update("confirmPassword", e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                    {error}
                  </p>
                )}

                {message && (
                  <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                    {message}
                  </p>
                )}

                <button className={primaryButton} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" size={18} /> : "Create Account & Verify Email"}
                  {!loading && <ArrowRight size={17} />}
                </button>
              </form>
            </>
          )}

          {screen === "verify" && (
            <>
              <button
                onClick={() => {
                  resetMessages();
                  setScreen("register");
                }}
                className="mb-6 flex items-center gap-2 text-xs text-slate-400 hover:text-white"
              >
                <ArrowLeft size={15} /> Back to Registration
              </button>

              <p className="mb-6 text-sm leading-6 text-slate-400">
                Enter the verification code sent to{" "}
                <span className="font-semibold text-white">{form.email}</span>.
              </p>

              <form onSubmit={verifyOtp} className="space-y-5">
                <div>
                  <label className={labelClass}>One-Time Password</label>
                  <input
                    className={`${inputClass} text-center text-2xl font-bold tracking-[12px]`}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="••••••"
                    value={form.otp}
                    onChange={(e) =>
                      update("otp", e.target.value.replace(/\D/g, ""))
                    }
                    required
                  />
                </div>

                {error && (
                  <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                    {error}
                  </p>
                )}

                {message && (
                  <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                    {message}
                  </p>
                )}

                <button className={primaryButton} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" size={18} /> : "Verify Email"}
                  {!loading && <CheckCircle2 size={17} />}
                </button>

                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={loading}
                  className="w-full text-center text-xs font-semibold text-blue-400 hover:text-blue-300 disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </form>
            </>
          )}

          <div className="mt-7 flex items-start gap-3 rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-4">
            <ShieldCheck className="mt-0.5 shrink-0 text-emerald-400" size={18} />
            <p className="text-[11px] leading-5 text-slate-400">
              Your account authentication is handled by the IndicCloud
              backend. Never share your password or verification code.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-6 text-[10px] text-slate-500">
          <span>Terms of Service</span>
          <span>Privacy Policy</span>
          <span>Secure Infrastructure</span>
        </div>

        <p className="mt-4 text-center text-[10px] tracking-wider text-slate-600">
          © {new Date().getFullYear()} INDICCLOUD
        </p>
      </div>
    </div>
  );
}

export default App;
