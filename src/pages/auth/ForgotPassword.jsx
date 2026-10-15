import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MailCheck } from 'lucide-react';
import AuthShell from './AuthShell.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Field.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/index.js';
import { validateEmail } from '../../utils/validation.js';

export default function ForgotPassword() {
  useDocumentTitle('Reset password');
  const { resetPassword } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const err = validateEmail(email);
    setError(err);
    if (err) return;
    setBusy(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (e2) {
      toast.error(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Reset password" subtitle="We’ll email you a secure link to choose a new password." footer={<Link to="/login" className="text-lime hover:underline">Back to login</Link>}>
      {sent ? (
        <div className="text-center" role="status">
          <MailCheck className="mx-auto h-12 w-12 text-lime" aria-hidden />
          <p className="mt-4 text-sm text-mist-300">If an account exists for <strong className="text-mist-100">{email}</strong>, a reset link is on its way.</p>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <Input label="Email" type="email" icon={Mail} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
          <Button type="submit" size="lg" className="w-full" loading={busy}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
