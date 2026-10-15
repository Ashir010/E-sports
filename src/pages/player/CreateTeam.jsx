import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/ui/SectionHeading.jsx';
import Button from '../../components/ui/Button.jsx';
import TeamForm from '../../components/teams/TeamForm.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/index.js';
import { GAMES, TEAM_COLORS } from '../../lib/constants.js';
import { validateTeam, hasErrors } from '../../utils/validation.js';

export default function CreateTeam() {
  useDocumentTitle('Create team');
  const { profile, userId } = useAuth();
  const { db, run } = useData();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialGame = GAMES[params.get('game')] ? params.get('game') : profile.favoriteGame || 'valorant';
  const [values, setValues] = useState({ name: '', tag: '', game: initialGame, color: TEAM_COLORS[0], logoUrl: null, college: profile.college, inGameId: profile.gameIds?.[initialGame] ?? '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const change = (v) => {
    // Pre-fill the in-game ID from the profile when switching games
    if (v.game !== values.game) v = { ...v, inGameId: profile.gameIds?.[v.game] ?? '' };
    setValues(v);
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validateTeam(values, db.teams);
    if (!values.inGameId?.trim()) errs.inGameId = 'Enter your in-game ID.';
    setErrors(errs);
    if (hasErrors(errs)) return;
    setBusy(true);
    try {
      const team = await run((api) => api.createTeam(userId, values));
      toast.success('Share the invite code with your teammates.', `${values.name} created`);
      navigate(`/teams/${team.id}/manage`);
    } catch (err) {
      toast.error(err.message, 'Could not create team');
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="// New squad" title="Create your team" description="You’ll be the captain. After creating, share your invite code so teammates can join." />
      <form onSubmit={submit} noValidate className="container-page max-w-2xl py-10">
        <div className="surface p-6 sm:p-8">
          <TeamForm values={values} onChange={change} errors={errors} showInGameId userId={userId} />
          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" loading={busy}>Create team</Button>
          </div>
        </div>
      </form>
    </>
  );
}
