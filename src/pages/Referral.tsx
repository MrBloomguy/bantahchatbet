import React from 'react';
import { Share2, Users } from 'lucide-react';
import { useReferral } from '../hooks/useReferral';
import MobileFooterNav from '../components/MobileFooterNav';
import PageHeader from '../components/PageHeader';
import MascotImage from '/referral-mascot.svg';

const Referral: React.FC = () => {
  const { referralCode, referralLink, stats } = useReferral();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    if (referralLink) {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (referralCode) {
      try {
        await navigator.share({
          title: 'Join me on Bantah!',
          text: `Use my code ${referralCode} and let's have fun!`,
          url: referralLink,
        });
      } catch (err) {
        // fallback: do nothing
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f6f7fb] to-[#e0e7ff] flex flex-col">
      <PageHeader title="Referrals" />
      <div className="max-w-lg mx-auto w-full px-4 py-8 space-y-6">
        {/* Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden shadow-xl bg-gradient-to-br from-blue-500/90 to-indigo-600/90 flex items-center p-6 mb-2">
          <img src={MascotImage} alt="Referral Mascot" className="w-20 h-20 drop-shadow-xl mr-6 z-10" />
          <div className="z-10">
            <h2 className="text-2xl font-extrabold text-white mb-1 tracking-tight">Invite & Earn Points</h2>
            <p className="text-white/80 text-base font-medium mb-2">Share your link, get points for every friend who joins!</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleShare}
                className="flex items-center gap-1 bg-[#CCFF00] text-gray-900 font-bold px-4 py-2 rounded-full shadow hover:bg-[#b3ff00] transition"
              >
                <Share2 className="w-5 h-5" /> Share
              </button>
              <button
                onClick={handleCopy}
                className="bg-white/20 text-white font-bold px-4 py-2 rounded-full border border-white/30 hover:bg-white/30 transition"
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-[#CCFF00]/20 rounded-full blur-2xl z-0" />
        </div>

        {/* Referral Link Card */}
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-2xl shadow p-4 flex flex-col items-center">
          <span className="text-xs text-gray-500 mb-1">Your Referral Link</span>
          <div className="flex items-center w-full gap-2">
            <input
              type="text"
              value={referralLink || ''}
              readOnly
              className="flex-1 bg-transparent text-gray-800 font-mono text-sm px-2 py-1 rounded border border-gray-200 focus:outline-none"
              onFocus={e => e.target.select()}
            />
            <button
              onClick={handleCopy}
              className="px-3 py-1 bg-[#CCFF00] text-gray-900 rounded font-semibold text-xs hover:bg-[#b3ff00] transition"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Stats Card */}
        <div className="grid grid-cols-2 gap-4">
          <div className="backdrop-blur-md bg-white/80 border border-white/40 rounded-2xl shadow p-4 flex flex-col items-center">
            <span className="text-gray-500 text-xs mb-1">Total Referrals</span>
            <span className="text-2xl font-bold text-blue-700">{stats.totalReferrals}</span>
          </div>
          <div className="backdrop-blur-md bg-white/80 border border-white/40 rounded-2xl shadow p-4 flex flex-col items-center">
            <span className="text-gray-500 text-xs mb-1">Points Earned</span>
            <span className="text-2xl font-bold text-green-600">{stats.totalRewards?.toLocaleString() || 0}</span>
          </div>
        </div>

        {/* Referrals List */}
        <div className="backdrop-blur-md bg-white/80 border border-white/40 rounded-2xl shadow p-4">
          <h3 className="text-base font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <Users className="w-4 h-4 text-blue-500" /> Your Referrals
          </h3>
          <div className="space-y-2">
            {stats.users.length === 0 && (
              <div className="text-gray-400 text-sm text-center">No referrals yet.</div>
            )}
            {stats.users.map((user) => (
              <div key={user.id} className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-blue-900">{user.username || user.email || user.id.slice(0, 6)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${user.status === 'completed' ? 'bg-green-400 text-white' : 'bg-yellow-400 text-gray-900'}`}>{user.status === 'completed' ? 'Joined' : 'Pending'}</span>
                </div>
                <span className="text-xs text-gray-500">{user.joined_at ? new Date(user.joined_at).toLocaleDateString() : ''}</span>
              </div>
            ))}
          </div>
        </div>

        {/* How to Earn Card */}
        <div className="backdrop-blur-md bg-white/80 border border-white/40 rounded-2xl shadow p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">How to Earn Points</h4>
          <ol className="list-decimal pl-5 space-y-1 text-gray-600 text-sm">
            <li>Share your referral link or code with friends.</li>
            <li>Friends sign up using your link or code.</li>
            <li>Earn points when they join and take actions!</li>
          </ol>
        </div>

        {/* Terms Card */}
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-2xl shadow p-3 text-xs text-gray-600">
          <h5 className="font-semibold mb-1">Terms</h5>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>Points are awarded on sign-up and certain actions.</li>
            <li>Use your correct code or link.</li>
            <li>Points rewards may change.</li>
            <li>Bantah manages referrals and rewards.</li>
          </ul>
        </div>
      </div>
      <MobileFooterNav />
    </div>
  );
};

export default Referral;