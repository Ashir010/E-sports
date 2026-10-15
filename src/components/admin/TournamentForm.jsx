import { Plus, Trash2 } from 'lucide-react';
import { Input, Select, Textarea, Checkbox } from '../ui/Field.jsx';
import Button from '../ui/Button.jsx';
import { GAME_LIST, FORMAT_LIST, TOURNAMENT_STATUS, defaultScoringFor, GAMES } from '../../lib/constants.js';
import { isoToIstLocal, formatMoney } from '../../utils/format.js';

/** Converts a stored tournament to editable form state (dates as IST datetime-local, lists as text). */
export function toFormState(t) {
  const game = t?.game ?? 'valorant';
  return {
    id: t?.id,
    name: t?.name ?? '',
    description: t?.description ?? '',
    game,
    format: t?.format ?? GAMES[game].defaultFormat,
    maxTeams: t?.maxTeams ?? 16,
    entryFee: t?.entryFee ?? 0,
    prizePool: t?.prizePool ?? 0,
    regDeadline: isoToIstLocal(t?.regDeadline),
    startAt: isoToIstLocal(t?.startAt),
    endAt: isoToIstLocal(t?.endAt),
    status: t?.status ?? 'draft',
    requiresApproval: t?.requiresApproval ?? false,
    featured: t?.featured ?? false,
    mode: t?.mode ?? 'Online',
    prizeDistribution: t?.prizeDistribution?.length ? t.prizeDistribution : [{ place: '1st', amount: 0 }],
    scoringRules: t?.scoringRules ?? defaultScoringFor(game),
    rulesText: (t?.rules ?? []).join('\n'),
    requirementsText: (t?.requirements ?? ['Valid college ID', 'Verified in-game ID for every player']).join('\n'),
  };
}

export default function TournamentForm({ form, setForm, errors }) {
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const rules = form.scoringRules;
  const prizeTotal = form.prizeDistribution.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  const changeGame = (e) => {
    const game = e.target.value;
    setForm({ ...form, game, format: GAMES[game].defaultFormat, scoringRules: defaultScoringFor(game) });
  };
  const setPrize = (i, k, v) => setForm({ ...form, prizeDistribution: form.prizeDistribution.map((p, j) => (j === i ? { ...p, [k]: k === 'amount' ? Number(v) : v } : p)) });

  return (
    <div className="space-y-6">
      <fieldset className="space-y-4">
        <legend className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-lime">Basics</legend>
        <Input label="Tournament name" required value={form.name} onChange={set('name')} error={errors.name} />
        <Textarea label="Description" value={form.description} onChange={set('description')} rows={2} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Select label="Game" required value={form.game} onChange={changeGame} options={GAME_LIST.map((g) => ({ value: g.id, label: g.name }))} error={errors.game} />
          <Select label="Format" required value={form.format} onChange={set('format')} options={FORMAT_LIST.map((f) => ({ value: f.id, label: f.label }))} error={errors.format} />
          <Select label="Mode" value={form.mode} onChange={set('mode')} options={['Online', 'LAN', 'Hybrid'].map((m) => ({ value: m, label: m }))} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-lime">Capacity & schedule (IST)</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Team limit" type="number" min={2} max={256} required value={form.maxTeams} onChange={set('maxTeams')} error={errors.maxTeams} />
          <Input label="Entry fee (₹)" type="number" min={0} value={form.entryFee} onChange={set('entryFee')} error={errors.entryFee} />
          <Input label="Prize pool (₹)" type="number" min={0} value={form.prizePool} onChange={set('prizePool')} error={errors.prizePool} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Registration deadline" type="datetime-local" required value={form.regDeadline} onChange={set('regDeadline')} error={errors.regDeadline} />
          <Input label="Start" type="datetime-local" required value={form.startAt} onChange={set('startAt')} error={errors.startAt} />
          <Input label="End" type="datetime-local" value={form.endAt} onChange={set('endAt')} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Checkbox label="Require admin approval" description="Registrations stay pending until approved." checked={form.requiresApproval} onChange={(v) => setForm({ ...form, requiresApproval: v })} />
          <Checkbox label="Featured" description="Highlight on the home page." checked={form.featured} onChange={(v) => setForm({ ...form, featured: v })} />
        </div>
        <Select label="Status" value={form.status} onChange={set('status')} options={Object.entries(TOURNAMENT_STATUS).map(([value, label]) => ({ value, label }))} hint="Drafts are visible only to admins." />
      </fieldset>

      <fieldset>
        <legend className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-lime">Prize distribution</legend>
        <div className="space-y-2">
          {form.prizeDistribution.map((p, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <Input aria-label={`Place ${i + 1}`} value={p.place} onChange={(e) => setPrize(i, 'place', e.target.value)} placeholder="1st" />
              <Input aria-label={`Amount for place ${i + 1}`} type="number" min={0} value={p.amount} onChange={(e) => setPrize(i, 'amount', e.target.value)} />
              <Button variant="ghost" size="icon" onClick={() => setForm({ ...form, prizeDistribution: form.prizeDistribution.filter((_, j) => j !== i) })} aria-label="Remove prize row" disabled={form.prizeDistribution.length === 1}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <Button size="sm" variant="ghost" onClick={() => setForm({ ...form, prizeDistribution: [...form.prizeDistribution, { place: '', amount: 0 }] })}>
            <Plus className="h-4 w-4" /> Add place
          </Button>
          <span className={`text-xs ${prizeTotal > Number(form.prizePool) ? 'text-danger' : 'text-mist-500'}`}>
            Distributed {formatMoney(prizeTotal)} of {formatMoney(Number(form.prizePool))}
          </span>
        </div>
        {errors.prizeDistribution && <p className="mt-1 text-xs text-danger">{errors.prizeDistribution}</p>}
      </fieldset>

      <fieldset>
        <legend className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-lime">Scoring rules</legend>
        <Select
          label="Scoring type"
          value={rules.type}
          onChange={(e) => setForm({ ...form, scoringRules: e.target.value === 'br' ? defaultScoringFor('bgmi') : defaultScoringFor('valorant') })}
          options={[
            { value: 'h2h', label: 'Head-to-head (win / draw / loss)' },
            { value: 'br', label: 'Battle royale (placement + kills)' },
          ]}
        />
        {rules.type === 'h2h' ? (
          <div className="mt-3 grid grid-cols-3 gap-3">
            {['win', 'draw', 'loss'].map((k) => (
              <Input key={k} label={`${k} pts`} type="number" value={rules[k]} onChange={(e) => setForm({ ...form, scoringRules: { ...rules, [k]: Number(e.target.value) } })} />
            ))}
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-[140px_1fr]">
            <Input label="Points per kill" type="number" min={0} value={rules.killPoints} onChange={(e) => setForm({ ...form, scoringRules: { ...rules, killPoints: Number(e.target.value) } })} />
            <Input
              label="Placement points (1st, 2nd, …)"
              value={rules.placementPoints.join(', ')}
              onChange={(e) => setForm({ ...form, scoringRules: { ...rules, placementPoints: e.target.value.split(',').map((x) => Number(x.trim()) || 0) } })}
              hint="Comma-separated"
            />
          </div>
        )}
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-lime">Rules & requirements</legend>
        <Textarea label="Rules (one per line)" value={form.rulesText} onChange={set('rulesText')} rows={4} />
        <Textarea label="Entry requirements (one per line)" value={form.requirementsText} onChange={set('requirementsText')} rows={3} />
      </fieldset>
    </div>
  );
}
