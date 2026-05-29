import { useState } from 'react';
import { ArrowRight, GraduationCap, Loader2, LockKeyhole, UserRound } from 'lucide-react';
import { API_BASE_URL } from '../config.js';

const roles = ['Student', 'Head', 'Faculty'];

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    Roll_Number: '',
    full_name: '',
    email: '',
    password: '',
    role: 'Student',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const payload =
      mode === 'login'
        ? {
            Roll_Number: form.Roll_Number,
            password: form.password,
          }
        : form;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/${mode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

  const isRegister = mode === 'register';

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
              ['Faculty', 'Govern approvals'],
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
              <LockKeyhole aria-hidden="true" size={21} />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-institute-ink">
                {isRegister ? 'Create Account' : 'Sign In'}
              </h2>
              <p className="text-sm text-slate-500">Roll Number access</p>
            </div>
          </div>

          {error ? (
            <div className="mb-4 rounded-lg border border-cardinal-600/20 bg-cardinal-50 px-4 py-3 text-sm font-medium text-cardinal-700">
              {error}
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={submit}>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Roll Number</span>
              <input
                name="Roll_Number"
                value={form.Roll_Number}
                onChange={updateField}
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
                    type="email"
                    value={form.email}
                    onChange={updateField}
                    className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-institute-ink outline-none transition focus:border-institute-blue focus:ring-2 focus:ring-institute-blue/20"
                    autoComplete="email"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Role</span>
                  <select
                    name="role"
                    value={form.role}
                    onChange={updateField}
                    className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-institute-ink outline-none transition focus:border-institute-blue focus:ring-2 focus:ring-institute-blue/20"
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </label>
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

          <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              {isRegister ? (
                <UserRound aria-hidden="true" size={16} />
              ) : (
                <GraduationCap aria-hidden="true" size={16} />
              )}
              <span>{isRegister ? 'Already registered' : 'New to CampusConnect'}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setMode(isRegister ? 'login' : 'register');
                setError('');
              }}
              className="text-sm font-semibold text-institute-blue hover:text-cardinal-700"
            >
              {isRegister ? 'Sign In' : 'Create Account'}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default AuthScreen;
