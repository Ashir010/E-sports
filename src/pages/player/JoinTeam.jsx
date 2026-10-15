import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, Gamepad2 } from 'lucide-react';
import AuthShell from '../auth/AuthShell.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Field.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/index.js';
import { validateInviteCode } from '../../utils/validation.js';
import { isDemoMode } from '../../services/api.js';

/** Join a team via invite code or invite link (/teams/join?code=XXXX). */
export default function JoinTeam() {
  useDocumentTitle('Join team');
  const { userId } = useAuth();
  const { run } = useData();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [code, setCode] = useState((params.get('code') ?? '').toUpperCase());
  const [inGameId, setInGameId] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    const c = validateInviteCode(code);
    if (c) errs.code = c;
    if (!inGameId.trim()) errs.inGameId = 'Enter your in-game ID for this game.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const team = await run((api) => api.joinTeam(userId, code, inGameId));
      toast.success('You’re on the roster.', 'Joined team');
      navigate(`/teams/${team.id}`);
    } catch (err) {
      toast.error(err.message, 'Could not join');
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Join a team" subtitle="Enter the invite code your captain shared with you.">
      <form onSubmit={submit} noValidate className="space-y-4">
        <Input label="Invite code" icon={KeyRound} value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} error={errors.code} maxLength={10} className="font-mono" autoComplete="off" />
        <Input label="Your in-game ID" icon={Gamepad2} value={inGameId} onChange={(e) => setInGameId(e.target.value)} error={errors.inGameId} hint="e.g. Name#TAG for Valorant, numeric ID for BGMI / Free Fire" />
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          Join team
        </Button>
        {isDemoMode && <p className="text-center text-xs text-mist-500">Demo tip: try <code className="text-mist-300">BYB3QS9A</code> (Booyah Brigade, Free Fire) — it has a free substitute slot.</p>}
      </form>
    </AuthShell>
  );
}
