import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import AuthShell from './AuthShell.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Field.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/index.js';
import { validatePassword } from '../../utils/validation.js';

/** Landing page for the Supabase recovery link (session is established from the URL by supabase-js). */
export default function ResetPassword() {
  useDocumentTitle('Choose a new password');
  const { updatePassword, userId } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    const p = validatePassword(pw);
    if (p) errs.pw = p;
    if (pw !== confirm) errs.confirm = 'Passwords do not match.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await updatePassword(pw);
      toast.success('Password updated.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const unavailable = !userId;
  return (
    <AuthShell title="New password" subtitle="Choose a strong password you haven’t used before.">
      {unavailable && (
        <p className="mb-4 rounded-lg border border-warn/30 bg-warn/5 p-3 text-xs text-warn">
          Open this page from the reset link in your email. The link may have expired — request a new one.
        </p>
      )}
      <form onSubmit={submit} noValidate className="space-y-4">
        <Input label="New password" type="password" icon={Lock} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} error={errors.pw} disabled={unavailable} />
        <Input label="Confirm password" type="password" icon={Lock} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} disabled={unavailable} />
        <Button type="submit" size="lg" className="w-full" loading={busy} disabled={unavailable}>
          Update password
        </Button>
      </form>
    </AuthShell>
  );
}
