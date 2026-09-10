import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Hash, ArrowRight, ShieldCheck, RefreshCw, KeyRound, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config.js';

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login'); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [form, setForm] = useState({
    Roll_Number: '',
    full_name: '',
    email: '',
    password: '',
  });

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(600);
  const otpRefs = useRef([]);

  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [recoveryStep, setRecoveryStep] = useState(1);

  useEffect(() => {
    let timer;
    if (mode === 'otp' && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [mode, countdown]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const updateField = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({
      ...current,
      [name]: name === 'Roll_Number' ? value.trim().toUpperCase() : value,
    }));
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Roll_Number: form.Roll_Number, password: form.password }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (body.requiresOtpVerification) {
          setForm(prev => ({ ...prev, email: body.email }));
          setMode('otp');
          setCountdown(600);
          throw new Error(body.message);
        }
        throw new Error(body.message || 'Authentication failed. Please check your credentials.');
      }

      onAuthenticated(body.data);
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Network error: Cannot reach the server. Please check your connection.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanEmail = form.email.toLowerCase().trim();
    if (!cleanEmail.endsWith('@siescoms.sies.edu.in')) {
      setError('Student registration requires an official institutional email (@siescoms.sies.edu.in).');
      setLoading(false);
      return;
    }

    // Strict validation: Must be MCA or MMS exactly followed by 5 digits
    const isStudentRoll = /^(MCA|MMS)\d{5}$/i.test(form.Roll_Number);
    if (!isStudentRoll) {
      setError('Roll number must be exactly MCA or MMS followed by 5 digits (e.g., MCA24001).');
      setLoading(false);
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.message || 'Registration failed');
      }

      setMode('otp');
      setCountdown(600);
      setSuccessMessage(body.message);
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Network error: Cannot reach the server.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5 && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0 && otpRefs.current[index - 1]) {
      otpRefs.current[index - 1].focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length < 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, otp: otpString }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(body.message || 'Verification failed');

      onAuthenticated(body.data);
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Network error: Cannot reach the server.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || 'Failed to resend OTP.');
      
      setCountdown(600);
      setOtp(['', '', '', '', '', '']);
      setSuccessMessage('A new verification code has been dispatched.');
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Network error: Cannot reach the server.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Recovery initiation failed');
      
      setSuccessMessage('Demo Mode: Token generated successfully!');
      setRecoveryToken(data.token);
      setRecoveryStep(2);
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Network error: Cannot reach the server.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password/${recoveryToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Reset execution failed');
      }
      setSuccessMessage('Password updated successfully! Please sign in.');
      setMode('login');
      setRecoveryStep(1);
      setRecoveryEmail('');
      setNewPassword('');
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Network error: Cannot reach the server.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const fadeSlide = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3 }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      
      {/* Left Panel - SIES Branding Graphic */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#1e3a8a] overflow-hidden">
        <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#172554] via-[#1e3a8a]/70 to-transparent" />
        
        <div className="relative z-10 flex flex-col justify-end p-16 w-full h-full text-white pb-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="backdrop-blur-md bg-white/10 p-8 rounded-3xl border border-white/20 shadow-2xl"
          >
            {/* Simulated SIES Sun Logo indicator */}
            <div className="mb-4">
               <div className="w-12 h-12 rounded-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] flex items-center justify-center">
                 <div className="w-8 h-8 rounded-full bg-white"></div>
               </div>
            </div>
            <h1 className="text-4xl font-bold mb-4 tracking-tight">CampusConnect</h1>
            <p className="text-blue-100 text-lg leading-relaxed mb-6">
              The centralized governance platform for SIESCOMS. Streamline campus recruitment, track applications, and manage committees securely.
            </p>
            <div className="grid grid-cols-3 gap-4 border-t border-white/20 pt-6">
              <div>
                <p className="font-bold text-amber-500">Students</p>
                <p className="text-xs text-blue-100 mt-1">Apply & track rounds</p>
              </div>
              <div>
                <p className="font-bold text-amber-500">Heads & POCs</p>
                <p className="text-xs text-blue-100 mt-1">Review applications</p>
              </div>
              <div>
                <p className="font-bold text-amber-500">Faculty</p>
                <p className="text-xs text-blue-100 mt-1">Oversight & governance</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Interactive Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md">
          
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-xl bg-rose-50 text-rose-700 text-sm border border-rose-200">
              {error}
            </motion.div>
          )}

          {successMessage && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-xl bg-blue-50 text-blue-800 text-sm border border-blue-200">
              {successMessage}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            
            {/* --- LOGIN MODE --- */}
            {mode === 'login' && (
              <motion.div key="login" {...fadeSlide} className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
                  <p className="text-slate-500 mt-2">Sign in to your institutional account.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                    <input
                      name="Roll_Number"
                      required
                      placeholder="Institutional ID or Email"
                      value={form.Roll_Number}
                      onChange={updateField}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-800 outline-none"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                    <input
                      name="password"
                      type="password"
                      required
                      placeholder="Password"
                      value={form.password}
                      onChange={updateField}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-800 outline-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button type="button" onClick={() => { setMode('forgot'); setError(''); setSuccessMessage(''); }} className="text-sm font-semibold text-blue-800 hover:text-blue-900">
                      Forgot Password?
                    </button>
                  </div>

                  <button disabled={loading} type="submit" className="w-full py-3.5 px-4 bg-[#1e3a8a] hover:bg-[#172554] text-white font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sign In'}
                    {!loading && <ArrowRight className="h-5 w-5 text-amber-500" />}
                  </button>
                </form>
              </motion.div>
            )}

            {/* --- REGISTER MODE --- */}
            {mode === 'register' && (
              <motion.div key="register" {...fadeSlide} className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Create an account</h2>
                  <p className="text-slate-500 mt-2">Register with your @siescoms.sies.edu.in email.</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                    <input name="full_name" required placeholder="Full Name" value={form.full_name} onChange={updateField} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-800 outline-none" />
                  </div>
                  <div className="relative">
                    <Hash className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                    <input name="Roll_Number" required placeholder="Roll Number (e.g. MCA24001)" value={form.Roll_Number} onChange={updateField} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-800 outline-none uppercase" />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                    <input name="email" type="email" required placeholder="Institutional Email (@siescoms...)" value={form.email} onChange={updateField} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-800 outline-none" />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                    <input name="password" type="password" required placeholder="Password (Min 8 characters)" value={form.password} onChange={updateField} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-800 outline-none" minLength={8} />
                  </div>

                  <button disabled={loading} type="submit" className="w-full py-3.5 px-4 bg-[#1e3a8a] hover:bg-[#172554] text-white font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Continue to Verification'}
                    {!loading && <ArrowRight className="h-5 w-5 text-amber-500" />}
                  </button>
                </form>
              </motion.div>
            )}

            {/* --- OTP VERIFICATION MODE --- */}
            {mode === 'otp' && (
              <motion.div key="otp" {...fadeSlide} className="space-y-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center shadow-inner">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Verify your email</h2>
                  <p className="text-slate-500 mt-2">Enter the 6-digit code sent to <br/><span className="font-semibold text-slate-800">{form.email}</span></p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-8">
                  <div className="flex justify-center gap-2 sm:gap-3">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-800 outline-none shadow-sm"
                      />
                    ))}
                  </div>

                  <button disabled={loading || otp.join('').length < 6} type="submit" className="w-full py-3.5 px-4 bg-[#1e3a8a] hover:bg-[#172554] text-white font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Verify Account'}
                  </button>
                </form>

                <div className="text-sm text-slate-500 flex flex-col items-center gap-3">
                  <p>Code expires in <span className="font-semibold text-slate-700">{formatTime(countdown)}</span></p>
                  
                  {/* Buttons structured with Cancel Action */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
                    <button 
                      onClick={handleResendOtp} 
                      disabled={loading || countdown > 540} 
                      className="text-blue-700 hover:text-blue-900 font-medium inline-flex items-center gap-1 disabled:opacity-50 transition-colors"
                    >
                      <RefreshCw className="h-4 w-4" /> Resend Code
                    </button>
                    
                    <span className="hidden sm:inline text-slate-300">|</span>

                    <button 
                      onClick={() => {
                        setMode('register');
                        setOtp(['', '', '', '', '', '']);
                        setCountdown(0);
                        setError('');
                      }} 
                      className="text-slate-500 hover:text-slate-800 font-medium transition-colors"
                    >
                      Cancel & Go Back
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* --- FORGOT PASSWORD MODE --- */}
            {mode === 'forgot' && (
              <motion.div key="forgot" {...fadeSlide} className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Account Recovery</h2>
                  <p className="text-slate-500 mt-2">Cryptographic reset gateway.</p>
                </div>

                {recoveryStep === 1 ? (
                  <form onSubmit={handleForgotSubmit} className="space-y-5">
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                      <input type="email" required placeholder="Institutional Email" value={recoveryEmail} onChange={(e) => setRecoveryEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-800 outline-none" />
                    </div>
                    <button disabled={loading} type="submit" className="w-full py-3.5 px-4 bg-[#1e3a8a] hover:bg-[#172554] text-white font-semibold rounded-xl shadow-lg transition-all flex justify-center">
                      {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Generate Recovery Token'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetSubmit} className="space-y-5">
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                      <input type="text" required placeholder="Paste Recovery Token" value={recoveryToken} onChange={(e) => setRecoveryToken(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-800 outline-none font-mono text-sm" />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                      <input type="password" required minLength={8} placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-800 outline-none" />
                    </div>
                    <button disabled={loading} type="submit" className="w-full py-3.5 px-4 bg-[#1e3a8a] hover:bg-[#172554] text-white font-semibold rounded-xl shadow-lg transition-all flex justify-center">
                      {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Commit New Password'}
                    </button>
                  </form>
                )}
              </motion.div>
            )}

          </AnimatePresence>

          {/* Bottom Navigation Toggle */}
          {mode !== 'otp' && (
            <div className="mt-8 flex items-center justify-center border-t border-slate-200 pt-6">
              <span className="text-sm text-slate-500 mr-2">
                {mode === 'register' ? 'Already registered?' : 'New to CampusConnect?'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'register' ? 'login' : 'register');
                  setError('');
                  setSuccessMessage('');
                }}
                className="text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors"
              >
                {mode === 'register' ? 'Sign In' : 'Create Account'}
              </button>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}

export default AuthScreen;