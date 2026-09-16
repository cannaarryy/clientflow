import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "../components/ui.js";
import { useAuth } from "../hooks/AuthContext.js";
import { useToast, errorMessage } from "../hooks/Toast.js";

export function LoginPage() {
  const { login } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate("/app");
    } catch (err) {
      push(errorMessage(err, "Could not log in"), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="card anim-fade-up p-6 sm:p-8">
          <h1 className="text-xl font-bold text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-[#A1A1A1]">Log in to your workspace.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@studio.co" />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" className="input" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button className="btn-primary w-full" disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
          </form>
          <p className="mt-4 rounded-lg bg-[#111] px-3 py-2 text-center font-mono text-[11px] leading-relaxed text-[#737373]">
            Demo account<br /><span className="text-[#A1A1A1]">demo@clientflow.io / Demo1234!</span>
          </p>
          <p className="mt-5 text-center text-sm text-[#A1A1A1]">
            No account? <Link to="/register" className="font-medium text-white hover:underline">Create one</Link>
          </p>
        </div>
        <p className="mt-6 text-center text-xs text-[#555]"><Link to="/" className="hover:text-[#A1A1A1]">← Back to site</Link></p>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      push("Password must be at least 8 characters", "error");
      return;
    }
    setBusy(true);
    try {
      await register(name.trim(), email.trim(), password);
      push("Account created. Welcome to ClientFlow.", "success");
      navigate("/app");
    } catch (err) {
      push(errorMessage(err, "Could not create account"), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="card anim-fade-up p-6 sm:p-8">
          <h1 className="text-xl font-bold text-white">Create your account</h1>
          <p className="mt-1 text-sm text-[#A1A1A1]">Start organizing your client work today.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="name">Name</label>
              <input id="name" className="input" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" autoComplete="name" />
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@studio.co" autoComplete="email" />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" className="input" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" autoComplete="new-password" />
            </div>
            <button className="btn-primary w-full" disabled={busy}>{busy ? "Creating…" : "Get started"}</button>
          </form>
          <p className="mt-5 text-center text-sm text-[#A1A1A1]">
            Have an account? <Link to="/login" className="font-medium text-white hover:underline">Log in</Link>
          </p>
        </div>
        <p className="mt-6 text-center text-xs text-[#555]"><Link to="/" className="hover:text-[#A1A1A1]">← Back to site</Link></p>
      </div>
    </div>
  );
}
