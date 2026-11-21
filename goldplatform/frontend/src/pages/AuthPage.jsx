import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import Backdrop from "../components/Backdrop.jsx";
import { PORTALS } from "../lib/portals.js";

const MINPW = { miner: 4, expert: 6, researcher: 4 };
const pwProblem = (pw, role) => (pw.length < MINPW[role] || !/[^A-Za-z0-9\s]/.test(pw)) ? `Use at least ${MINPW[role]} characters and include one special character, for example @ # ! ? $ %.` : "";

function Field({ id, label, type = "text", value, onChange, required, autoComplete }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}{required && <span className="text-goldhi"> (required)</span>}</label>
      <input id={id} name={id} type={type} className="field" value={value ?? ""} required={required}
        autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function PasswordField({ id, label, value, onChange, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <div className="relative">
        <input id={id} type={show ? "text" : "password"} className="field pr-20" value={value} required
          autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)} />
        <button type="button" onClick={() => setShow(!show)} aria-pressed={show}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-sm font-semibold text-goldhi glow hover:bg-white/10">
          {show ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}

export default function AuthPage() {
  const { portal } = useParams();
  const cfg = PORTALS[portal];
  const { user, setUser } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState("login");
  const isAdmin = portal === "admin";
  const [f, setF] = useState({});
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [forgot, setForgot] = useState(false);

  if (!cfg) return <Navigate to="/" replace />;
  if (user && user.role === portal) return <Navigate to={`/${portal}`} replace />;
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  const run = async (fn) => {
    setBusy(true); setMsg({ type: "", text: "" });
    try { await fn(); } catch (e) { setMsg({ type: "error", text: e.message }); } finally { setBusy(false); }
  };
  const done = (u) => { setUser(u); nav(`/${portal}`); };

  const submit = (e) => {
    e.preventDefault();
    run(async () => {
      if (forgot) {
        const r = await api("/auth/forgot-password", { method: "POST", body: { email: f.email } });
        return setMsg({ type: "ok", text: r.message });
      }
      if (mode === "login") return done(await api("/auth/login", { method: "POST", body: { role: portal, identifier: f.identifier, password: f.password, remember } }));
      const bad = pwProblem(f.password || "", portal); if (bad) throw new Error(bad);
      const body = { ...f }; if (body.years_experience) body.years_experience = Number(body.years_experience);
      done(await api(`/auth/register/${portal}`, { method: "POST", body }));
    });
  };

  const google = (cred) => run(async () => done(await api("/auth/google", { method: "POST", body: { role: portal, credential: cred.credential } })));

  return (
    <Backdrop src={cfg.bg} tint={0.25}><div className="fixed inset-0 z-20 overflow-y-auto"><div className="flex min-h-full items-center justify-center p-3 sm:p-4">
      <section className="pop gold-scroll w-full max-w-lg overflow-y-auto rounded-2xl border border-gold/40 bg-canopy/85 p-5 text-white shadow-2xl shadow-black/40 backdrop-blur-md sm:p-8" style={{ maxHeight: "88vh" }} aria-labelledby="t">
        <Link to="/" className="text-sm font-semibold text-goldhi glow hover:underline">Back to home</Link>
        <h1 id="t" className="mt-2 font-display text-3xl font-extrabold text-goldhi">{cfg.label}</h1>

        {!forgot && portal !== "admin" && (
          <div role="tablist" className="mt-4 grid grid-cols-2 rounded-lg bg-white/10 p-1">
            {["login", "register"].map((m) => (
              <button key={m} role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setMsg({}); }}
                className={`rounded-md py-2 font-semibold transition duration-300 ${mode === m ? "bg-gold text-canopy shadow" : "text-white glow"}`}>
                {m === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={submit} className="mt-5 space-y-4" key={`${mode}${forgot}`}>
          {forgot ? (
            <>
              <p>Enter your account email and we will send a reset link that works for 30 minutes.</p>
              <Field id="email" label="Email address" type="email" required value={f.email} onChange={set("email")} />
            </>
          ) : mode === "login" ? (
            <>
              <Field id="identifier" label={cfg.idLabel} required value={f.identifier} onChange={set("identifier")} autoComplete="username" />
              <PasswordField id="password" label="Password" value={f.password ?? ""} onChange={set("password")} autoComplete="current-password" />
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me</label>
                {portal !== "miner" && <button type="button" onClick={() => setForgot(true)} className="font-semibold text-goldhi glow hover:underline">Forgot password?</button>}
              </div>
            </>
          ) : (
            <>
              {cfg.register.map(([k, label, type, req]) => <Field key={k} id={k} label={label} type={type} required={req} value={f[k]} onChange={set(k)} />)}
              <PasswordField id="password" label={`Password (at least ${MINPW[portal]} characters, including one special character such as @ # !)`} value={f.password ?? ""} onChange={set("password")} autoComplete="new-password" />
              <PasswordField id="confirm_password" label="Confirm password" value={f.confirm_password ?? ""} onChange={set("confirm_password")} autoComplete="new-password" />
              {portal === "expert" && <p className="rounded-lg bg-gold/20 p-3 text-sm">Your account starts as <b>pending verification</b>. Your EIA licence is checked before your profile appears publicly as verified.</p>}
            </>
          )}

          {msg.text && <p role="alert" className={`pop rounded-lg p-3 text-sm font-medium ${msg.type === "ok" ? "bg-moss text-canopy" : "bg-red-100 text-red-800"}`}>{msg.text}</p>}

          <button className="btn btn-green w-full" disabled={busy}>{busy ? "Please wait…" : forgot ? "Send reset link" : mode === "login" ? "Sign in" : "Create account"}</button>
          {forgot && <button type="button" onClick={() => { setForgot(false); setMsg({}); }} className="w-full text-sm font-semibold text-goldhi glow hover:underline">Back to sign in</button>}
        </form>

        {!isAdmin && (!forgot && portal !== "expert" || (!forgot && mode === "login") ? (
          <div className="mt-5 flex justify-center border-t border-fern/30 pt-5">
            {import.meta.env.VITE_GOOGLE_CLIENT_ID
              ? <GoogleLogin onSuccess={google} onError={() => setMsg({ type: "error", text: "Google sign-in was cancelled." })} />
              : <p className="text-sm text-white/70">Google sign-in appears here once VITE_GOOGLE_CLIENT_ID is set.</p>}
          </div>
        ) : null)}
        {portal === "miner" && mode === "login" && <p className="mt-3 text-center text-sm">Password reset for miner accounts is not available yet. Contact Support if you are locked out.</p>}
      </section>
    </div></div></Backdrop>
  );
}
