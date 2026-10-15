import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import AuthShell from './AuthShell.jsx';
import { safeRedirect } from './Login.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input, Select } from '../../components/ui/Field.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/index.js';
import { isDemoMode } from '../../services/api.js';
import { GAME_LIST } from '../../lib/constants.js';
import { validateSignup, hasErrors } from '../../utils/validation.js';

export default function Signup() {
  useDocumentTitle('Sign up');
  const { signUp, userId } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = safeRedirect(params.get('redirect') ?? params.get('next'), '/dashboard');
  const [form, setForm] = useState({ displayName: '', username: '', email: '', college: '', favoriteGame: 'valorant', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  if (userId && !busy) return <Navigate to={redirect} replace />;
  const field = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }), error: errors[k] });

  const submit = async (e) => {
    e.preventDefault();
    const errs = validateSignup(form, { requirePassword: !isDemoMode });
    setErrors(errs);
    if (hasErrors(errs)) return;
    setBusy(true);
    try {
      const res = await signUp({ ...form, email: form.email.trim(), username: form.username.trim(), displayName: form.displayName.trim(), college: form.college.trim() });
      if (res.needsConfirmation) {
        setSent(true);
        setBusy(false);
        return;
      }
      toast.success(isDemoMode ? 'Demo profile created in this browser.' : 'Account created. Welcome!');
      navigate(redirect, { replace: true });
    } catch (err) {
      toast.error(err.message, 'Sign up failed');
      setBusy(false);
    }
  };

  if (sent)
    return (
      <AuthShell title="Check your inbox" subtitle={`We sent a confirmation link to ${form.email}.`}>
        <div className="text-center">
          <MailCheck className="mx-auto h-12 w-12 text-lime" aria-hidden />
          <p className="mt-4 text-sm text-mist-300">Confirm your email, then log in to finish setting up your profile.</p>
          <Button to="/login" className="mt-6 w-full">Go to login</Button>
        </div>
      </AuthShell>
    );

  return (
    <AuthShell
      title="Join the arena"
      subtitle="Create your player account in under a minute."
      footer={
        <>
          Already have an account? <Link to="/login" className="font-medium text-lime hover:underline">Log in</Link>
        </>
      }
    >
      {isDemoMode && <p className="mb-5 rounded-lg border border-warn/30 bg-warn/5 p-3 text-xs text-warn">Demo mode: this creates a profile stored only in this browser. No password is saved and no email is sent.</p>}
      <form onSubmit={submit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Display name" required autoComplete="name" {...field('displayName')} />
          <Input label="Username" required autoComplete="username" hint="Shown on leaderboards" {...field('username')} />
        </div>
        <Input label="Email" type="email" required autoComplete="email" {...field('email')} />
        <Input label="College" required placeholder="e.g. Delhi Technological University" {...field('college')} />
        <Select label="Favourite game" {...field('favoriteGame')} options={GAME_LIST.map((g) => ({ value: g.id, label: g.name }))} />
        {!isDemoMode && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Password" type="password" required autoComplete="new-password" hint="8+ chars, letters & numbers" {...field('password')} />
            <Input label="Confirm password" type="password" required autoComplete="new-password" {...field('confirm')} />
          </div>
        )}
        <p className="text-xs text-mist-500">
          By signing up you agree to the <Link to="/terms" className="text-mist-300 underline">Terms</Link> and <Link to="/privacy" className="text-mist-300 underline">Privacy Policy</Link>.
        </p>
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
