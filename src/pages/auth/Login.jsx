import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import AuthShell from './AuthShell.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Field.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/index.js';
import { validateEmail } from '../../utils/validation.js';

/** Only allow same-site relative redirects. */
export function safeRedirect(value, fallback = '/dashboard') {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : fallback;
}

export default function Login() {
  useDocumentTitle('Login');
  const { signIn, userId } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = safeRedirect(params.get('redirect'));
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  if (userId && !busy) return <Navigate to={redirect} replace />;

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    const em = validateEmail(form.email);
    if (em) errs.email = em;
    if (!form.password) errs.password = 'Password is required.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await signIn({ email: form.email.trim(), password: form.password });
      toast.success('Welcome back!');
      navigate(redirect, { replace: true });
    } catch (err) {
      toast.error(err.message, 'Login failed');
      setBusy(false);
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
      <form onSubmit={submit} noValidate className="space-y-4">
        <Input label="Email" type="email" icon={Mail} autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
        <Input label="Password" type="password" icon={Lock} autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs text-mist-400 hover:text-lime">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" size="lg" loading={busy}>
          Log in
        </Button>
      </form>
    </AuthShell>
  );
}
