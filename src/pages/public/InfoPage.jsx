import { useState } from 'react';
import { Mail, MessageCircle, MapPin, Copy, Check } from 'lucide-react';
import { PageHeader } from '../../components/ui/SectionHeading.jsx';
import Button from '../../components/ui/Button.jsx';
import { useDocumentTitle } from '../../hooks/index.js';
import { useToast } from '../../context/ToastContext.jsx';

const CONTACT_EMAIL = 'hello@esportshub.example';

const PAGES = {
  about: {
    eyebrow: '// About',
    title: 'Built for campus esports',
    description: 'Esports Hub gives college gaming clubs one place to run tournaments, and gives students one place to compete.',
    sections: [
      ['Our mission', 'College esports is growing fast, but most tournaments still run on spreadsheets, group chats and screenshots. Esports Hub replaces that with clean registration, published schedules, and rankings calculated from real results.'],
      ['What we support', 'BGMI, Valorant, Free Fire and Mini Militia — with head-to-head scoring for tactical shooters and placement-plus-kills scoring for battle royale lobbies. Organisers can configure scoring per tournament.'],
      ['Fair play', 'Rankings are never edited by hand. Every point on the leaderboard traces back to a match result entered by an authorised tournament admin.'],
    ],
  },
  privacy: {
    eyebrow: '// Legal',
    title: 'Privacy Policy',
    description: 'How we collect and use your information.',
    sections: [
      ['What we collect', 'Your email (for login), display name, username, college, favourite game, in-game IDs and an optional avatar. Match results and team memberships are recorded as part of tournaments.'],
      ['What is public', 'Your username, display name, avatar, college, team memberships, in-game IDs and match statistics are visible to other users so teams and opponents can find you. Your email address is never shown publicly.'],
      ['Security', 'Passwords are handled by Supabase Auth and are never stored or visible to Esports Hub organisers. Database access is restricted with row-level security policies.'],
      ['Your choices', 'You can edit your profile at any time. To delete your account, contact the organisers using the email on the Contact page.'],
    ],
  },
  terms: {
    eyebrow: '// Legal',
    title: 'Terms & Conditions',
    description: 'The rules of using Esports Hub.',
    sections: [
      ['Eligibility', 'Tournaments are open to currently enrolled college students unless a tournament states otherwise. Organisers may request proof of enrolment.'],
      ['Fair play', 'Cheating, emulators, account sharing, match fixing and harassment lead to disqualification and may result in a ban from future events.'],
      ['Registrations', 'Captains are responsible for their roster. Withdrawals are allowed until the registration deadline. Entry fees, where charged, are handled by the organising committee outside this platform.'],
      ['Results', 'Results entered by tournament admins are final unless a dispute is raised by the team captain within 15 minutes of the match ending.'],
      ['Trademarks', 'Game names are trademarks of their respective owners. Esports Hub is an independent community platform and is not affiliated with any game publisher.'],
    ],
  },
};

export default function InfoPage({ page }) {
  const data = PAGES[page];
  useDocumentTitle(page === 'contact' ? 'Contact' : data.title);
  if (page === 'contact') return <Contact />;
  return (
    <>
      <PageHeader eyebrow={data.eyebrow} title={data.title} description={data.description} />
      <div className="container-page max-w-3xl space-y-8 py-12">
        {data.sections.map(([h, body]) => (
          <section key={h}>
            <h2 className="mb-2 text-xl font-semibold uppercase">{h}</h2>
            <p className="leading-relaxed text-mist-300">{body}</p>
          </section>
        ))}
      </div>
    </>
  );
}

function Contact() {
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      toast.success('Email address copied.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy — please select the address manually.');
    }
  };
  return (
    <>
      <PageHeader eyebrow="// Contact" title="Talk to the organisers" description="Questions about a tournament, a dispute, or hosting an event at your college? Reach out." />
      <div className="container-page grid gap-5 py-12 md:grid-cols-3">
        <div className="surface p-6">
          <Mail className="h-6 w-6 text-lime" aria-hidden />
          <h2 className="mt-4 text-lg font-semibold uppercase">Email</h2>
          <p className="mt-1 break-all text-sm text-mist-300">{CONTACT_EMAIL}</p>
          <div className="mt-4 flex gap-2">
            <Button href={`mailto:${CONTACT_EMAIL}`} size="sm">Send email</Button>
            <Button size="sm" variant="secondary" onClick={copy} aria-label="Copy email address">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className="surface p-6">
          <MessageCircle className="h-6 w-6 text-lime" aria-hidden />
          <h2 className="mt-4 text-lg font-semibold uppercase">Discord</h2>
          <p className="mt-1 text-sm text-mist-300">Match coordination and disputes happen on the community server.</p>
          <Button href="https://discord.com" target="_blank" rel="noreferrer noopener" size="sm" variant="secondary" className="mt-4">Open Discord</Button>
        </div>
        <div className="surface p-6">
          <MapPin className="h-6 w-6 text-lime" aria-hidden />
          <h2 className="mt-4 text-lg font-semibold uppercase">Host an event</h2>
          <p className="mt-1 text-sm text-mist-300">Gaming clubs can run their own tournaments on Esports Hub. Email us with your college name and the games you want to host.</p>
        </div>
      </div>
    </>
  );
}
