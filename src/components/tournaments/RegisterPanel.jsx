import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Lock, Users, AlertCircle, CheckCircle2, LogIn, Plus } from 'lucide-react';
import Button from '../ui/Button.jsx';
import { Select } from '../ui/Field.jsx';
import { ConfirmDialog } from '../ui/Modal.jsx';
import { RegStatusBadge } from '../ui/Badge.jsx';
import { TeamLogo } from '../ui/Avatar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { checkRegistration, checkWithdraw, slotsLeft, getDisplayStatus, rosterLimits } from '../../utils/registrationRules.js';
import { teamsForUser } from '../../utils/selectors.js';
import { GAMES } from '../../lib/constants.js';
import { formatDateTime } from '../../utils/format.js';

/**
 * Registration card on the tournament page. Every state is driven by checkRegistration(),
 * and the server re-validates on submit.
 */
export default function RegisterPanel({ tournament }) {
  const { userId } = useAuth();
  const { db, run } = useData();
  const toast = useToast();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(null);

  const myTeams = useMemo(() => (userId ? teamsForUser(db, userId).filter((t) => t.game === tournament.game) : []), [db, userId, tournament.game]);
  const captainTeams = myTeams.filter((t) => t.captainId === userId);
  const [teamId, setTeamId] = useState('');
  const myRegs = db.registrations.filter((r) => r.tournamentId === tournament.id && myTeams.some((t) => t.id === r.teamId) && r.status !== 'withdrawn');
  const unregistered = captainTeams.filter((t) => !myRegs.some((r) => r.teamId === t.id));
  const selectedTeam = captainTeams.find((t) => t.id === teamId) ?? unregistered[0] ?? captainTeams[0] ?? null;
  const status = getDisplayStatus(tournament);
  const left = slotsLeft(tournament, db.registrations);
  const check = checkRegistration({ tournament, team: selectedTeam, members: db.members, registrations: db.registrations, userId });
  const { min, max } = rosterLimits(tournament.format);

  const register = async () => {
    setBusy(true);
    try {
      const result = await run((api) => api.registerTeam(userId, tournament.id, selectedTeam.id));
      toast.success(result === 'pending' ? 'Submitted — an admin will review your registration.' : `${selectedTeam.name} is registered. Good luck!`, 'Registration received');
    } catch (e) {
      toast.error(e.message, 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async () => {
    setBusy(true);
    try {
      await run((api) => api.withdrawRegistration(userId, confirmWithdraw.id));
      toast.info('Your team has withdrawn from the tournament.');
      setConfirmWithdraw(null);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="register" className="surface scroll-mt-28 p-5 sm:p-6" aria-labelledby="register-title">
      <div className="flex items-center justify-between gap-2">
        <h2 id="register-title" className="text-lg font-semibold uppercase">Registration</h2>
        <span className="font-mono text-xs text-mist-400 tabular">{left} slot{left === 1 ? '' : 's'} left</span>
      </div>
      <p className="mt-1 text-xs text-mist-500">Closes {formatDateTime(tournament.regDeadline)}</p>

      <ul className="mt-4 space-y-2 text-sm text-mist-300">
        <li className="flex items-center gap-2"><Users className="h-4 w-4 text-mist-500" /> Roster: {min}{max > min ? `–${max}` : ''} players ({max - min} sub{max - min === 1 ? '' : 's'} allowed)</li>
        <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-mist-500" /> {tournament.requiresApproval ? 'Admin approval required' : 'Instant confirmation'}</li>
      </ul>

      {myRegs.length > 0 && (
        <div className="mt-5 space-y-2">
          {myRegs.map((r) => {
            const team = db.teams.find((t) => t.id === r.teamId);
            const w = checkWithdraw({ tournament, registration: r, team, userId });
            return (
              <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-lime/20 bg-lime/5 p-3">
                <TeamLogo team={team} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-mist-100">{team.name}</p>
                  <RegStatusBadge status={r.status} />
                </div>
                {w.ok && (
                  <Button size="sm" variant="danger" onClick={() => setConfirmWithdraw(r)}>
                    Withdraw
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5">
        {!userId ? (
          <Gate icon={LogIn} message="Log in to register your team.">
            <Button to={`/login?redirect=${encodeURIComponent(location.pathname)}`} className="w-full">Log in to register</Button>
          </Gate>
        ) : status !== 'open' ? (
          <Gate icon={Lock} message={status === 'closed' ? 'Registration has closed.' : 'Registration is not open for this tournament.'} />
        ) : myRegs.length > 0 && unregistered.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-lime"><CheckCircle2 className="h-4 w-4" /> You are in this tournament.</p>
        ) : captainTeams.length === 0 ? (
          <Gate icon={AlertCircle} message={myTeams.length ? `Only your team captain can register. Ask them to sign up your ${GAMES[tournament.game].name} team.` : `You need a ${GAMES[tournament.game].name} team where you are captain.`}>
            {!myTeams.length && (
              <div className="grid grid-cols-2 gap-2">
                <Button to={`/teams/create?game=${tournament.game}`} size="sm"><Plus className="h-4 w-4" /> Create team</Button>
                <Button to="/teams/join" variant="secondary" size="sm">Join with code</Button>
              </div>
            )}
          </Gate>
        ) : (
          <div className="space-y-3">
            {captainTeams.length > 1 && (
              <Select label="Team" value={selectedTeam?.id} onChange={(e) => setTeamId(e.target.value)} options={captainTeams.map((t) => ({ value: t.id, label: t.name }))} />
            )}
            {captainTeams.length === 1 && (
              <div className="flex items-center gap-3 rounded-xl bg-ink-850 p-3">
                <TeamLogo team={selectedTeam} size="sm" />
                <span className="text-sm font-medium text-mist-100">{selectedTeam.name}</span>
              </div>
            )}
            {!check.ok && (
              <p className="flex items-start gap-2 rounded-xl border border-warn/30 bg-warn/5 p-3 text-sm text-warn" role="status">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {check.message}
                {check.code === 'TEAM_SIZE' && (
                  <Link to={`/teams/${selectedTeam.id}/manage`} className="ml-auto shrink-0 underline">Manage</Link>
                )}
              </p>
            )}
            <Button className="w-full" size="lg" disabled={!check.ok} loading={busy} onClick={register}>
              Register {selectedTeam?.name}
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmWithdraw}
        onClose={() => setConfirmWithdraw(null)}
        onConfirm={withdraw}
        loading={busy}
        title="Withdraw from tournament?"
        message="Your slot will be released to other teams. You can register again while registration is open, if slots remain."
        confirmLabel="Withdraw team"
      />
    </section>
  );
}

function Gate({ icon: Icon, message, children }) {
  return (
    <div className="space-y-3">
      <p className="flex items-start gap-2 text-sm text-mist-300">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-mist-500" /> {message}
      </p>
      {children}
    </div>
  );
}
