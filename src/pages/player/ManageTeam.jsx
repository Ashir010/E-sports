import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Copy, Link2, RefreshCw, Crown, UserMinus, LogOut, Trash2, ArrowLeft, Eye } from 'lucide-react';
import { PageHeader } from '../../components/ui/SectionHeading.jsx';
import Button from '../../components/ui/Button.jsx';
import { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { RegStatusBadge, TournamentStatusBadge } from '../../components/ui/Badge.jsx';
import PageFallback from '../../components/ui/PageFallback.jsx';
import { EmptyState } from '../../components/ui/States.jsx';
import TeamForm from '../../components/teams/TeamForm.jsx';
import NotFound from '../public/NotFound.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/index.js';
import { GAMES } from '../../lib/constants.js';
import { byId, teamMembers } from '../../utils/selectors.js';
import { rosterLimits, getDisplayStatus, checkWithdraw } from '../../utils/registrationRules.js';
import { validateTeam, hasErrors } from '../../utils/validation.js';

export default function ManageTeam() {
  const { id } = useParams();
  const { userId } = useAuth();
  const { db, loading, run } = useData();
  const toast = useToast();
  const navigate = useNavigate();
  const team = byId(db.teams, id);
  useDocumentTitle(team ? `Manage ${team.name}` : 'Manage team');

  const [values, setValues] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(null);
  const [confirm, setConfirm] = useState(null); // { kind, member?, reg? }

  useEffect(() => {
    if (team) setValues({ name: team.name, tag: team.tag, game: team.game, color: team.color, logoUrl: team.logoUrl, college: team.college });
  }, [team?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || (team && !values)) return <PageFallback />;
  if (!team) return <NotFound what="team" />;

  const members = teamMembers(db, team.id);
  const isCaptain = team.captainId === userId;
  const isMember = members.some((m) => m.profileId === userId);
  if (!isMember) return <NotFound what="team" />;

  const { min, max } = rosterLimits(GAMES[team.game].defaultFormat);
  const regs = db.registrations.filter((r) => r.teamId === team.id && r.status !== 'withdrawn').map((r) => ({ r, t: byId(db.tournaments, r.tournamentId) }));
  const inviteLink = `${window.location.origin}/teams/join?code=${team.inviteCode}`;

  const act = async (key, fn, success) => {
    setBusy(key);
    try {
      const res = await run(fn);
      if (success) toast.success(success);
      setConfirm(null);
      return res;
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    const errs = validateTeam(values, db.teams, team.id);
    setErrors(errs);
    if (hasErrors(errs)) return;
    await act('save', (api) => api.updateTeam(userId, team.id, values), 'Team details saved.');
  };

  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard.`);
    } catch {
      toast.error('Clipboard unavailable — select and copy manually.');
    }
  };

  const confirmAction = async () => {
    const c = confirm;
    if (c.kind === 'remove') await act('confirm', (api) => api.removeMember(userId, team.id, c.member.profileId), `${c.member.profile?.username} removed.`);
    if (c.kind === 'captain') await act('confirm', (api) => api.transferCaptain(userId, team.id, c.member.profileId), `${c.member.profile?.username} is now captain.`);
    if (c.kind === 'regen') await act('confirm', (api) => api.regenerateInvite(userId, team.id), 'New invite code generated. The old one no longer works.');
    if (c.kind === 'withdraw') await act('confirm', (api) => api.withdrawRegistration(userId, c.reg.id), 'Registration withdrawn.');
    if (c.kind === 'leave') {
      const ok = await act('confirm', (api) => api.leaveTeam(userId, team.id).then(() => true), 'You left the team.');
      if (ok) navigate('/my-teams');
    }
    if (c.kind === 'delete') {
      const ok = await act('confirm', (api) => api.deleteTeam(userId, team.id).then(() => true), 'Team deleted.');
      if (ok) navigate('/my-teams');
    }
  };

  const CONFIRM_COPY = {
    remove: ['Remove player?', `${confirm?.member?.profile?.username} will be removed from the roster.`, 'Remove'],
    captain: ['Transfer captaincy?', `${confirm?.member?.profile?.username} will become captain. You’ll lose captain controls for this team.`, 'Transfer'],
    regen: ['Generate a new invite code?', 'The current code and link will stop working immediately.', 'Generate', 'primary'],
    withdraw: ['Withdraw registration?', `Your team will leave ${confirm?.t?.name}. The slot is released to other teams.`, 'Withdraw'],
    leave: ['Leave team?', `You’ll be removed from ${team.name}.`, 'Leave team'],
    delete: ['Delete team?', 'This permanently deletes the team. Teams with match history cannot be deleted.', 'Delete team'],
  };
  const cc = confirm ? CONFIRM_COPY[confirm.kind] : null;

  return (
    <>
      <PageHeader eyebrow={isCaptain ? '// Captain controls' : '// Team'} title={team.name} description={`${GAMES[team.game].name} · ${members.length}/${max} players (min ${min} to register)`}>
        <div className="flex flex-wrap gap-2">
          <Button to="/my-teams" variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> My teams</Button>
          <Button to={`/teams/${team.id}`} variant="secondary" size="sm"><Eye className="h-4 w-4" /> Public page</Button>
        </div>
      </PageHeader>
      <div className="container-page grid gap-6 py-10 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          {/* Roster */}
          <section className="surface p-5 sm:p-6" aria-labelledby="roster-h">
            <div className="mb-4 flex items-center justify-between">
              <h2 id="roster-h" className="text-lg font-semibold uppercase">Roster</h2>
              <span className={`font-mono text-xs ${members.length < min ? 'text-warn' : 'text-lime'}`}>
                {members.length}/{max} {members.length < min ? `· need ${min - members.length} more` : '· ready'}
              </span>
            </div>
            <ul className="divide-y divide-white/5">
              {members.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center gap-3 py-3">
                  <Avatar profile={m.profile} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 font-medium text-mist-100">
                      {m.profile?.username} {m.role === 'captain' && <Crown className="h-3.5 w-3.5 text-lime" aria-label="Captain" />}
                      {m.profileId === userId && <span className="text-xs text-mist-500">(you)</span>}
                    </p>
                    <p className="font-mono text-xs text-mist-500">{m.inGameId}</p>
                  </div>
                  {isCaptain && m.profileId !== userId && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setConfirm({ kind: 'captain', member: m })} aria-label={`Make ${m.profile?.username} captain`}>
                        <Crown className="h-4 w-4" /> <span className="hidden sm:inline">Make captain</span>
                      </Button>
                      <Button size="sm" variant="ghost" className="text-danger hover:bg-danger/10" onClick={() => setConfirm({ kind: 'remove', member: m })} aria-label={`Remove ${m.profile?.username}`}>
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* Details */}
          {isCaptain && (
            <form onSubmit={save} noValidate className="surface p-5 sm:p-6" aria-labelledby="details-h">
              <h2 id="details-h" className="mb-5 text-lg font-semibold uppercase">Team details</h2>
              <TeamForm values={values} onChange={setValues} errors={errors} lockGame userId={userId} />
              <div className="mt-6 flex justify-end">
                <Button type="submit" loading={busy === 'save'}>Save changes</Button>
              </div>
            </form>
          )}

          {/* Registrations */}
          <section className="surface p-5 sm:p-6" aria-labelledby="regs-h">
            <h2 id="regs-h" className="mb-4 text-lg font-semibold uppercase">Tournament registrations</h2>
            {regs.length ? (
              <ul className="space-y-2">
                {regs.map(({ r, t }) => {
                  const w = checkWithdraw({ tournament: t, registration: r, team, userId });
                  return (
                    <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-ink-850 p-3">
                      <Link to={`/tournaments/${t.id}`} className="min-w-0 flex-1 truncate font-medium text-mist-100 hover:text-lime">{t.name}</Link>
                      <TournamentStatusBadge status={getDisplayStatus(t)} />
                      <RegStatusBadge status={r.status} />
                      {w.ok && <Button size="sm" variant="danger" onClick={() => setConfirm({ kind: 'withdraw', reg: r, t })}>Withdraw</Button>}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState title="Not registered yet" message="Find an open tournament for your game." action={<Button to={`/tournaments?game=${team.game}&status=open`} size="sm">Browse open tournaments</Button>} className="py-8" />
            )}
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {isCaptain && (
            <section className="surface p-5 sm:p-6" aria-labelledby="invite-h">
              <h2 id="invite-h" className="text-lg font-semibold uppercase">Invite teammates</h2>
              <p className="mt-1 text-sm text-mist-400">Share the code or link. Players join by entering it with their in-game ID.</p>
              <div className="mt-4 flex items-center justify-between rounded-xl border border-dashed border-lime/40 bg-lime/5 px-4 py-3">
                <code className="font-mono text-2xl font-bold tracking-[0.2em] text-lime">{team.inviteCode}</code>
                <button onClick={() => copy(team.inviteCode, 'Invite code')} className="rounded-lg p-2 text-mist-300 hover:bg-white/5 hover:text-lime" aria-label="Copy invite code">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button size="sm" variant="secondary" onClick={() => copy(inviteLink, 'Invite link')}><Link2 className="h-4 w-4" /> Copy link</Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirm({ kind: 'regen' })}><RefreshCw className="h-4 w-4" /> New code</Button>
              </div>
            </section>
          )}
          <section className="rounded-2xl border border-danger/25 p-5 sm:p-6" aria-labelledby="danger-h">
            <h2 id="danger-h" className="text-lg font-semibold uppercase text-danger">Danger zone</h2>
            {isCaptain ? (
              <>
                <p className="mt-1 text-sm text-mist-400">Captains must transfer captaincy before leaving. Deleting is only possible without match history or active registrations.</p>
                <Button variant="danger" size="sm" className="mt-4" onClick={() => setConfirm({ kind: 'delete' })}><Trash2 className="h-4 w-4" /> Delete team</Button>
              </>
            ) : (
              <>
                <p className="mt-1 text-sm text-mist-400">Leave this team. Rosters lock while the team is competing.</p>
                <Button variant="danger" size="sm" className="mt-4" onClick={() => setConfirm({ kind: 'leave' })}><LogOut className="h-4 w-4" /> Leave team</Button>
              </>
            )}
          </section>
        </aside>
      </div>
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={confirmAction} loading={busy === 'confirm'} title={cc?.[0]} message={cc?.[1]} confirmLabel={cc?.[2]} tone={cc?.[3] ?? 'danger'} />
    </>
  );
}
