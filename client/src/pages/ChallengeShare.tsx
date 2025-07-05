import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

interface Challenge {
  id: string;
  title: string;
  status: string;
  amount: number;
  game_type: string;
  platform: string;
  rules?: string;
  required_evidence?: string;
  challenger: {
    name: string;
    avatar_url: string;
  };
  challenged: {
    name: string;
    avatar_url: string;
  };
  scheduled_at?: string;
}

// This page is for social sharing and meta tags
export default function ChallengeShare() {
  const { id } = useParams();
  const [challenge, setChallenge] = useState<Challenge | null>(null);

  useEffect(() => {
    async function fetchChallenge() {
      const res = await fetch(`/api/challenge/${id}`); // You need to implement this API endpoint
      if (res.ok) {
        setChallenge(await res.json());
      }
    }
    if (id) fetchChallenge();
  }, [id]);

  if (!challenge) return <div>Loading...</div>;

  // Meta tags for social sharing
  return (
    <>
      <head>
        <title>{`Challenge: ${challenge.challenger.name} vs ${challenge.challenged.name}`}</title>
        <meta property="og:title" content={`Challenge: ${challenge.challenger.name} vs ${challenge.challenged.name}`} />
        <meta property="og:description" content={`${challenge.challenger.name} challenged ${challenge.challenged.name} to a ${challenge.game_type} match for ₦${challenge.amount}. Scheduled for ${challenge.scheduled_at || 'TBA'}.`} />
        <meta property="og:image" content={challenge.challenger.avatar_url || '/default-avatar.png'} />
        <meta property="og:url" content={`${window.location.origin}/challenge/${challenge.id}`} />
        <meta name="twitter:card" content="summary_large_image" />
      </head>
      <div>
        <h1>Challenge: {challenge.challenger.name} vs {challenge.challenged.name}</h1>
        <p>{challenge.challenger.name} challenged {challenge.challenged.name} to a {challenge.game_type} match for ₦{challenge.amount}.</p>
        <p>Scheduled for: {challenge.scheduled_at || 'TBA'}</p>
      </div>
    </>
  );
}
