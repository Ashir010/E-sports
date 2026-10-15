import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Shield, Crown, User, FlaskConical } from 'lucide-react';
import AuthShell from './AuthShell.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Field.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/index.js';
import { isDemoMode } from '../../services/api.js';
import { validateEmail } from '../../utils/validation.js';

const DEMO_ACCOUNTS = [
  { id: 'u-demo-captain', label: 'Team Captain', who: 'kabir.gg · captain of Phantom Protocol', icon: Crown },
  { id: 'u-demo-player', label: 'Player', who: 'ananya.exe · member of Neon Vandals', icon: User },
  { id: 'u-demo-admin', label: 'Administrator', who: 'arena.admin · full admin panel', icon: Shield },
];

/** Only allow same-site relative redirects. */
export function safeRedirect(value, fallback = '/dashboard') {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : fallback;
}

export default function Login() {
  useDocumentTitle('Login');
  const { signIn, demoLogin, userId } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = safeRedirect(params.get('redirect'));
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(null);

  if (userId && !busy) return <Navigate to={redirect} replace />;

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    const em = validateEmail(form.email);
    if (em) errs.email = em;
    if (!form.password) errs.password = 'Password is required.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy('form');
    try {
      await signIn(form);
      toast.success('Welcome back!');
      navigate(redirect, { replace: true });
    } catch (err) {
      toast.error(err.message, 'Login failed');
      setBusy(null);
    }
  };

  const demo = async (id) => {
    setBusy(id);
    try {
      await demoLogin(id);
      toast.success('Signed in to a demo account.');
      navigate(id === 'u-demo-admin' && redirect === '/dashboard' ? '/admin' : redirect, { replace: true });
    } catch (err) {
      toast.error(err.message);
      setBusy(null);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to manage your team and register for tournaments."
      footer={
        <>
          New here?{' '}
          <Link to={`/signup${params.get('redirect') ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="font-medium text-lime hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      {isDemoMode && (
        <div className="mb-6">
          <p className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-warn">
            <FlaskConical className="h-3.5 w-3.5" /> Demo mode — try a role
          </p>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((a) => (
              <button key={a.id} onClick={() => demo(a.id)} disabled={!!busy} className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-ink-850 p-3 text-left transition hover:border-lime/40 disabled:opacity-50">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime/10 text-lime">
                  <a.icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-mist-100">Continue as {a.label}</span>
                  <span className="block truncate text-xs text-mist-500">{a.who}</span>
                </span>
                {busy === a.id && <span className="h-4 w-4 animate-spin rounded-full border-2 border-lime border-t-transparent" aria-label="Signing in" />}
              </button>
            ))}
          </div>
          <div className="my-6 flex items-center gap-3 text-xs text-mist-500">
            <span className="h-px flex-1 bg-white/10" /> email login <span className="h-px flex-1 bg-white/10" />
          </div>
        </div>
      )}
      <form onSubmit={submit} noValidate className="space-y-4">
        {isDemoMode && <p className="rounded-lg bg-white/[0.03] p-3 text-xs text-mist-400">Email and password login is available once Supabase is configured. Demo accounts above have no password.</p>}
        <Input label="Email" type="email" icon={Mail} autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} disabled={isDemoMode} />
        <Input label="Password" type="password" icon={Lock} autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} disabled={isDemoMode} />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs text-mist-400 hover:text-lime">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" size="lg" loading={busy === 'form'} disabled={isDemoMode || (!!busy && busy !== 'form')}>
          Log in
        </Button>
      </form>
    </AuthShell>
  );
}
