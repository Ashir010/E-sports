import { useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { Input, Select } from '../ui/Field.jsx';
import { TeamLogo } from '../ui/Avatar.jsx';
import Button from '../ui/Button.jsx';
import { GAME_LIST, TEAM_COLORS, GAMES } from '../../lib/constants.js';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { rosterLimits } from '../../utils/registrationRules.js';
import { cn } from '../../utils/format.js';

/**
 * Controlled team details form. `values` = { name, tag, game, color, logoUrl, college, inGameId? }
 * `lockGame` disables the game picker (games can't change after creation).
 */
export default function TeamForm({ values, onChange, errors = {}, lockGame = false, showInGameId = false, userId }) {
  const toast = useToast();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const set = (k) => (e) => onChange({ ...values, [k]: k === 'tag' ? e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5) : e.target.value });
  const { min, max } = rosterLimits(GAMES[values.game]?.defaultFormat);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const url = await api.uploadImage(file, userId);
      onChange({ ...values, logoUrl: url });
    } catch (err) {
      toast.error(err.message, 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-ink-850 p-4">
        <TeamLogo team={{ ...values, name: values.name || 'Team', tag: values.tag || '??' }} size="xl" />
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-xs uppercase tracking-wider text-mist-400">Team logo</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()} loading={uploading}>
              <ImagePlus className="h-4 w-4" /> Upload image
            </Button>
            {values.logoUrl && (
              <Button size="sm" variant="ghost" onClick={() => onChange({ ...values, logoUrl: null })}>
                <Trash2 className="h-4 w-4" /> Remove
              </Button>
            )}
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={upload} aria-label="Upload team logo" />
          </div>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Team colour">
            {TEAM_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={values.color === c}
                aria-label={`Colour ${c}`}
                onClick={() => onChange({ ...values, color: c })}
                className={cn('h-6 w-6 rounded-md ring-offset-2 ring-offset-ink-850 transition', values.color === c && 'ring-2 ring-mist-100')}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <Input label="Team name" required value={values.name} onChange={set('name')} error={errors.name} maxLength={24} />
        <Input label="Tag" required value={values.tag} onChange={set('tag')} error={errors.tag} hint="2–5 chars" />
      </div>
      <Select
        label="Game"
        required
        value={values.game}
        onChange={set('game')}
        disabled={lockGame}
        error={errors.game}
        hint={lockGame ? 'A team’s game can’t be changed after creation.' : `Roster: ${min}–${max} players including subs.`}
        options={GAME_LIST.map((g) => ({ value: g.id, label: `${g.name} — ${g.genre}` }))}
      />
      <Input label="College" value={values.college} onChange={set('college')} />
      {showInGameId && <Input label={`Your ${GAMES[values.game]?.name} in-game ID`} required value={values.inGameId} onChange={set('inGameId')} error={errors.inGameId} hint="Shown on your roster so opponents can find you." />}
    </div>
  );
}
