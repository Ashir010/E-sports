import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImagePlus, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/ui/SectionHeading.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input, Select, Textarea } from '../../components/ui/Field.jsx';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/index.js';
import { api } from '../../services/api.js';
import { GAME_LIST, TEAM_COLORS } from '../../lib/constants.js';
import { validateProfile, hasErrors } from '../../utils/validation.js';
import { cn } from '../../utils/format.js';

export default function EditProfile() {
  useDocumentTitle('Edit profile');
  const { profile, userId } = useAuth();
  const { db, run } = useData();
  const toast = useToast();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    displayName: profile.displayName,
    username: profile.username,
    college: profile.college,
    favoriteGame: profile.favoriteGame ?? 'valorant',
    bio: profile.bio ?? '',
    avatarUrl: profile.avatarUrl,
    avatarColor: profile.avatarColor ?? TEAM_COLORS[0],
    gameIds: { ...profile.gameIds },
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const upload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      setForm({ ...form, avatarUrl: await api.uploadImage(file, userId) });
    } catch (err) {
      toast.error(err.message, 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validateProfile(form, db.profiles, userId);
    if (form.bio.length > 200) errs.bio = 'Keep your bio under 200 characters.';
    setErrors(errs);
    if (hasErrors(errs)) return;
    setBusy(true);
    try {
      const gameIds = Object.fromEntries(Object.entries(form.gameIds).map(([k, v]) => [k, v?.trim() ?? '']).filter(([, v]) => v));
      await run((a) => a.updateProfile(userId, { ...form, gameIds, username: form.username.trim(), displayName: form.displayName.trim(), college: form.college.trim() }));
      toast.success('Profile updated.');
      navigate(`/players/${form.username.trim()}`);
    } catch (err) {
      toast.error(err.message, 'Could not save');
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="// Profile" title="Edit profile" description="This information appears on your public player page and team rosters. Your email is never shown publicly." />
      <form onSubmit={submit} noValidate className="container-page grid max-w-4xl gap-6 py-10 lg:grid-cols-[260px_1fr]">
        <div className="surface h-fit p-5 text-center">
          <Avatar profile={{ ...profile, ...form }} size="xl" className="mx-auto" />
          <div className="mt-4 flex justify-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()} loading={uploading}><ImagePlus className="h-4 w-4" /> Upload</Button>
            {form.avatarUrl && <Button size="sm" variant="ghost" onClick={() => setForm({ ...form, avatarUrl: null })} aria-label="Remove avatar"><Trash2 className="h-4 w-4" /></Button>}
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={upload} aria-label="Upload avatar" />
          {!form.avatarUrl && (
            <div className="mt-4 flex flex-wrap justify-center gap-1.5" role="radiogroup" aria-label="Avatar colour">
              {TEAM_COLORS.map((c) => (
                <button key={c} type="button" role="radio" aria-checked={form.avatarColor === c} aria-label={`Colour ${c}`} onClick={() => setForm({ ...form, avatarColor: c })} className={cn('h-6 w-6 rounded-full ring-offset-2 ring-offset-ink-800', form.avatarColor === c && 'ring-2 ring-mist-100')} style={{ background: c }} />
              ))}
            </div>
          )}
        </div>
        <div className="space-y-6">
          <section className="surface space-y-4 p-5 sm:p-6">
            <h2 className="text-lg font-semibold uppercase">Basics</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Display name" required value={form.displayName} onChange={set('displayName')} error={errors.displayName} />
              <Input label="Username" required value={form.username} onChange={set('username')} error={errors.username} />
            </div>
            <Input label="College" required value={form.college} onChange={set('college')} error={errors.college} />
            <Select label="Favourite game" value={form.favoriteGame} onChange={set('favoriteGame')} options={GAME_LIST.map((g) => ({ value: g.id, label: g.name }))} />
            <Textarea label="Bio" value={form.bio} onChange={set('bio')} error={errors.bio} hint={`${form.bio.length}/200`} rows={3} />
          </section>
          <section className="surface space-y-4 p-5 sm:p-6">
            <h2 className="text-lg font-semibold uppercase">Gaming IDs</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {GAME_LIST.map((g) => (
                <Input key={g.id} label={g.name} value={form.gameIds[g.id] ?? ''} onChange={(e) => setForm({ ...form, gameIds: { ...form.gameIds, [g.id]: e.target.value } })} placeholder={g.id === 'valorant' ? 'Name#TAG' : 'In-game ID'} />
              ))}
            </div>
          </section>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" loading={busy}>Save profile</Button>
          </div>
        </div>
      </form>
    </>
  );
}
