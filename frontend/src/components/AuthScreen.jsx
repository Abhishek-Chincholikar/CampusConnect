import { useState } from 'react';
import { ArrowRight, GraduationCap, Loader2, LockKeyhole, UserRound, KeyRound } from 'lucide-react';
import { API_BASE_URL } from '../config.js';

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login'); // 'login', 'register', or 'forgot'
  const [form, setForm] = useState({
    Roll_Number: '',
    full_name: '',
    email: '',
    password: '',
    role: 'Student',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Account Recovery States
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [recoveryStep, setRecoveryStep] = useState(1);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      // We process inputs cleanly without hardcoding global uppercase locks on text fields
      [name]: name === 'Roll_Number' ? value.trim() : value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    // Reconcile user role implicitly via identifier input field domains
    const checkCredential = String(form.Roll_Number || '').toLowerCase().trim();
    const cleanEmail = String(form.email || '').toLowerCase().trim();
    
    const isFacultyDomain = checkCredential.endsWith('@sies.edu.in') || cleanEmail.endsWith('@sies.edu.in');
    const resolvedRole = isFacultyDomain ? 'Faculty' : 'Student';

    const payload = mode === 'login' 
      ? { Roll_Number: form.Roll_Number, password: form.password } 
      : { 
          ...form, 
          role: resolvedRole 
        };

    try {
      const response = await fetch(`${API_BASE_URL}/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.message || 'Authentication failed');
      }

      onAuthenticated(body.data);
    } catch (authError) {
      setError(authError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Recovery initiation failed');
      
      setSuccessMessage('Demo Mode: Token generated successfully!');
      setRecoveryToken(data.token); // Synchronized token stream directly from database
      setRecoveryStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password/${recoveryToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Reset execution failed');
      }
      alert('Password updated successfully! Redirecting to clean Sign-In gate...');
      setMode('login');
      setRecoveryStep(1);
      setRecoveryEmail('');
      setNewPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isRegister = mode === 'register';
  const isForgot = mode === 'forgot';

  return (
    <main className="min-h-screen bg-institute-mist">
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-5 py-10 lg:grid-cols-[1fr_460px] lg:px-8">
        <section className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-normal text-cardinal-700">
            SIESCOMS Committees & Clubs
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-normal text-institute-ink">
            CampusConnect
          </h1>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ['Students', 'Apply and track rounds'],
              ['Heads', 'Review applicants'],
              ['Faculty', 'Govern approvals & Orgs'],
            ].map(([title, detail]) => (
              <div key={title} className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="font-semibold text-institute-ink">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-lift">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-institute-navy text-white">
              {isForgot ? <KeyRound aria-hidden="true" size={21} /> : <LockKeyhole aria-hidden="true" size={21} />}
            </span>
            <div>
              <h2 className="text-xl font-semibold text-institute-ink">
                {isForgot ? 'Account Recovery' : isRegister ? 'Create Account' : 'Sign In'}
              </h2>
              <p className="text-sm text-slate-500">
                {isForgot ? 'Cryptographic Reset' : 'Institutional access gateway'}
              </p>
            </div>
          </div>

          {error ? (
            <div className="mb-4 rounded-lg border border-cardinal-600/20 bg-cardinal-50 px-4 py-3 text-sm font-medium text-cardinal-700">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mb-4 rounded-lg border border-emerald-600/20 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {successMessage}
            </div>
          ) : null}

          {/* LAYER SWITCH 1: ACCOUNT RECOVERY FORM INTERFACES */}
          {isForgot ? (
            recoveryStep === 1 ? (
              <form className="space-y-4" onSubmit={handleForgotPasswordSubmit}>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Institutional Email Address</span>
                  <input
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="professor@sies.edu.in or student@siescoms.sies.edu.in"
                    className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-institute-ink outline-none transition focus:border-institute-blue focus:ring-2 focus:ring-institute-blue/20"
                    required
                  />
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:bg-slate-300"
                >
                  {loading ? <Loader2 aria-hidden="true" className="animate-spin" size={18} /> : null}
                  <span>Generate Recovery Token</span>
                </button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleResetPasswordSubmit}>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Recovery Token</span>
                  <input
                    type="text"
                    value={recoveryToken}
                    onChange={(e) => setRecoveryToken(e.target.value)}
                    className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-institute-ink font-mono outline-none transition focus:border-institute-blue focus:ring-2 focus:ring-institute-blue/20"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">New Password</span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={8}
                    placeholder="••••••••"
                    className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-institute-ink outline-none transition focus:border-institute-blue focus:ring-2 focus:ring-institute-blue/20"
                    required
                  />
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:bg-slate-300"
                >
                  {loading ? <Loader2 aria-hidden="true" className="animate-spin" size={18} /> : null}
                  <span>Commit New Password</span>
                </button>
              </form>
            )
          ) : (
            /* LAYER SWITCH 2: AUTHENTICATION LOGIN AND REGISTRATION SIGNUP FORMS */
            <form className="space-y-4" onSubmit={submit}>
              <label className="block">
                {/* UNIFIED DESIGNATION LABELS REMOVING TARGET SIZE EXPLICIT LOCKS */}
                <span className="text-sm font-semibold text-slate-700">Institutional ID / Email Address</span>
                <input
                  name="Roll_Number"
                  value={form.Roll_Number}
                  onChange={updateField}
                  placeholder="e.g., MCA25015, SIESF101, or name@sies.edu.in"
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-institute-ink outline-none transition focus:border-institute-blue focus:ring-2 focus:ring-institute-blue/20"
                  autoComplete="username"
                  required
                />
              </label>

              {isRegister ? (
                <>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Full Name</span>
                    <input
                      name="full_name"
                      value={form.full_name}
                      onChange={updateField}
                      className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-institute-ink outline-none transition focus:border-institute-blue focus:ring-2 focus:ring-institute-blue/20"
                      autoComplete="name"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Email</span>
                    <input
                      name="email"
                      placeholder="student@siescoms.sies.edu.in or faculty@sies.edu.in"
                      type="email"
                      value={form.email}
                      onChange={updateField}
                      required
                      className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-institute-ink outline-none transition focus:border-institute-blue focus:ring-2 focus:ring-institute-blue/20"
                      autoComplete="email"
                    />
                  </label>
                    <div className="block">
                      <span className="text-sm font-semibold text-slate-700 block mb-2">
                        Institutional Designation Scope
                      </span>
                      
                      {/* Professional dynamic fallback card box */}
                      <div className="flex h-11 w-full items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-500 shadow-inner select-none">
                        {form.Roll_Number.toLowerCase().endsWith('@sies.edu.in') 
                          ? 'Faculty Coordinator (Academic Governance Panel Mode Active)' 
                          : 'Student (General Access Tiers)'}
                      </div>

                      {/* DYNAMIC FORM INJECTION PARAMETER CONTROL */}
                      <input 
                        type="hidden" 
                        name="role" 
                        value={form.Roll_Number.toLowerCase().endsWith('@sies.edu.in') ? 'Faculty' : 'Student'} 
                      />
                    </div>
                </>
              ) : null}

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Password</span>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={updateField}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-institute-ink outline-none transition focus:border-institute-blue focus:ring-2 focus:ring-institute-blue/20"
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  minLength={8}
                  required
                />
              </label>

              {!isRegister && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); setSuccessMessage(''); }}
                    className="text-xs font-semibold text-slate-500 hover:text-institute-blue"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-institute-navy px-4 text-sm font-semibold text-white transition hover:bg-institute-blue focus:outline-none focus:ring-2 focus:ring-institute-blue focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {loading ? <Loader2 aria-hidden="true" className="animate-spin" size={18} /> : null}
                <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
                {!loading ? <ArrowRight aria-hidden="true" size={17} /> : null}
              </button>
            </form>
          )}

          <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              {isRegister ? <UserRound aria-hidden="true" size={16} /> : <GraduationCap aria-hidden="true" size={16} />}
              <span>
                {isForgot ? 'Back to authentication' : isRegister ? 'Already registered' : 'New to CampusConnect'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setMode(isForgot || isRegister ? 'login' : 'register');
                setError('');
                setSuccessMessage('');
              }}
              className="text-sm font-semibold text-institute-blue hover:text-cardinal-700"
            >
              {isForgot || isRegister ? 'Sign In' : 'Create Account'}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default AuthScreen;