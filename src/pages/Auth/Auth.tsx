import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { Mountain } from 'lucide-react';
import { alpineHero } from '@/data/trips';
import { PageShell } from '@/components/common';
import { hashPassword, isStrongPassword, isValidMobileNumber, readUsers } from '@/services/auth';

export function AuthPage({ mode = 'login' }: { mode?: 'login' | 'signup' }) {
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const cleanEmail = email.trim().toLowerCase();
    const cleanMobile = mobile.replace(/\D/g, '').trim();
    if (!cleanEmail || !password || (!isLogin && (!name.trim() || !cleanMobile))) { setError('Please fill in all required fields.'); return; }
    if (!isLogin && !isValidMobileNumber(cleanMobile)) { setError('Mobile number must be exactly 10 digits and start with 6.'); return; }
    if (!isLogin && password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (!isLogin && !isStrongPassword(password)) {
      setError('Password must include at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.');
      return;
    }
    setLoading(true);
    try {
      const users = readUsers();
      const existing = users.find((item) => item.email === cleanEmail);
      const passwordHash = await hashPassword(password);
      if (isLogin) {
        if (!existing) { setError('You are not registered. Please sign up first.'); return; }
        if (existing.passwordHash !== passwordHash) { setError('Incorrect password.'); return; }
        localStorage.setItem('travel-with-trails-current-user', JSON.stringify({ name: existing.name, email: existing.email, mobile: existing.mobile }));
      } else {
        if (existing) { setError('An account with this email already exists. Please log in.'); return; }
        const user = { id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: name.trim(), email: cleanEmail, mobile: cleanMobile, passwordHash };
        localStorage.setItem('travel-with-trails-users-v1', JSON.stringify([...users, user]));
        localStorage.setItem('travel-with-trails-current-user', JSON.stringify({ name: user.name, email: user.email, mobile: user.mobile }));
      }
      window.dispatchEvent(new Event('travel-with-trails-auth-changed'));
      setLocation('/');
    } finally { setLoading(false); }
  };

  const signInWithGoogle = () => {
    setError('');
    setGoogleLoading(true);
    localStorage.setItem('travel-with-trails-current-user', JSON.stringify({ name: 'Google Traveller', email: 'traveller@google.com' }));
    window.dispatchEvent(new Event('travel-with-trails-auth-changed'));
    window.setTimeout(() => {
      setGoogleLoading(false);
      setLocation('/');
    }, 160);
  };

  return <PageShell><main className="flex min-h-[calc(100dvh-72px)] items-center justify-center px-5 py-10 lg:py-14"><div className="grid w-full max-w-[960px] overflow-hidden rounded-[30px] border border-border bg-card shadow-xl lg:grid-cols-[.9fr_1.1fr]">
    <div className="relative hidden min-h-[560px] overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between"><div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url(${alpineHero})`, backgroundSize: 'cover', backgroundPosition: 'center' }} /><div className="relative"><div className="flex size-11 items-center justify-center rounded-2xl bg-[#f0c983] text-primary"><Mountain size={22}/></div><p className="mt-7 text-[10px] font-bold uppercase tracking-[.22em] text-[#e4e8d9]/75">Travel with Trails</p><h1 className="mt-3 max-w-[330px] font-display text-[42px] leading-[.98] tracking-[-.04em]">Your next trail starts here.</h1></div><div className="relative rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm"><p className="font-display text-[20px]">“Less worries. More mountains.”</p><p className="mt-2 text-[10px] text-[#e4e8d9]/70">Save your travellers, manage bookings and keep every journey in one place.</p></div></div>
    <section className="p-7 sm:p-10"><Link href="/" className="text-[11px] font-semibold text-muted-foreground hover:text-primary">← Back to Travel with Trails</Link><div className="mt-8"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-primary/70">{isLogin ? 'Welcome back' : 'Start your journey'}</p><h2 className="mt-2 font-display text-[34px] tracking-[-.03em]">{isLogin ? 'Log in to your account' : 'Create your account'}</h2><p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{isLogin ? 'Access your bookings and saved traveller details.' : 'Save your traveller details once and book future trips faster.'}</p></div>
      <form onSubmit={submit} className="mt-7 space-y-4">
        {!isLogin && <label className="block"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">Full name</span><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="h-11 w-full rounded-xl border border-border bg-background px-4 text-[12px] outline-none focus:border-primary" placeholder="Your name" /></label>}
        {!isLogin && <label className="block"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">Mobile number</span><input value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} type="tel" inputMode="numeric" autoComplete="tel" className="h-11 w-full rounded-xl border border-border bg-background px-4 text-[12px] outline-none focus:border-primary" placeholder="6XXXXXXXXX" required /></label>}
        <label className="block"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">Email address</span><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" className="h-11 w-full rounded-xl border border-border bg-background px-4 text-[12px] outline-none focus:border-primary" placeholder="you@example.com" /></label>
        <label className="block"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">Password</span><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} className="h-11 w-full rounded-xl border border-border bg-background px-4 text-[12px] outline-none focus:border-primary" placeholder="Min 8 chars • A-Z • a-z • 0-9 • special character" />{!isLogin && <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">Use at least 8 characters with one uppercase, one lowercase, one number, and one special character.</p>}</label>
        {!isLogin && <label className="block"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">Confirm password</span><input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" autoComplete="new-password" className="h-11 w-full rounded-xl border border-border bg-background px-4 text-[12px] outline-none focus:border-primary" placeholder="Re-enter your password" /></label>}
        {error && <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-[11px] font-semibold text-destructive">{error}</div>}
        <button disabled={loading} type="submit" className="h-12 w-full rounded-full bg-primary text-[11px] font-bold text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-60">{loading ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}</button>
      </form>

      <div className="mt-4 flex items-center gap-3"><span className="h-px flex-1 bg-border"></span><span className="text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">or</span><span className="h-px flex-1 bg-border"></span></div>
      <button type="button" onClick={signInWithGoogle} disabled={googleLoading} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-4 text-[11px] font-bold text-foreground transition-all hover:border-primary hover:bg-secondary disabled:opacity-70"><span className="flex size-6 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground">G</span><span>{googleLoading ? 'Connecting Google…' : 'Sign in with Google'}</span></button>

      <div className="mt-6 text-center text-[11px] text-muted-foreground">{isLogin ? "Don't have an account?" : 'Already have an account?'} <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }} className="font-bold text-primary hover:underline">{isLogin ? 'Sign up' : 'Log in'}</button></div>
      <p className="mt-5 text-center text-[9px] leading-relaxed text-muted-foreground">Your account is stored locally in this prototype. For production, connect this flow to Firebase Authentication.</p>
    </section>
  </div></main></PageShell>;
}

