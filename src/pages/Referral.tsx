import React from 'react';
import { Share2, Gift, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useReferral } from '../hooks/useReferral';
import MobileFooterNav from '../components/MobileFooterNav';
import PageHeader from '../components/PageHeader';
import MascotImage from '/referral-mascot.svg'; // Update import path for referral mascot image

const Referral: React.FC = () => {
  const navigate = useNavigate();
  const { referralCode, referralLink, stats, generateReferralCode } = useReferral();
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
          url: window.location.origin,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-pink-50 flex flex-col">
      <PageHeader title="Referrals" />

      <div className="max-w-md mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-4">
        {/* Short Banner with Mascot */}
        <div className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl shadow-md p-4 flex items-center text-white">
          <img src={MascotImage} alt="Referral Mascot" className="w-16 h-16 mr-4" />
          <div>
            <h2 className="text-lg font-semibold">Invite Friends & Get Treats!</h2>
            <p className="text-sm opacity-80">Share the fun, earn rewards.</p>
          </div>
          <button
            onClick={handleShare}
            className="bg-yellow-400 text-blue-800 rounded-full px-3 py-1.5 text-sm font-semibold ml-auto hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400"
          >
            <Share2 className="w-4 h-4 mr-1" />
            Share
          </button>
        </div>

        {/* Compact Referral Code Section */}
        <div className="bg-white rounded-xl shadow-md p-3">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Code</h2>
          <div className="bg-gray-100 rounded-lg p-2 flex items-center justify-between">
            <p className="text-base font-mono text-gray-800 break-all">{referralLink || '-------'}</p>
            <button
              onClick={handleCopy}
              className="px-2 py-1 bg-green-400 text-white rounded-md text-xs font-semibold hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Compact Stats Card */}
        <div className="bg-yellow-100 rounded-xl shadow-md p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <Users className="w-4 h-4 text-yellow-500 mr-1" /> Your Referrals
          </h2>
          <div className="space-y-2">
            {stats.users.length === 0 && (
              <div className="text-gray-500 text-sm">No referrals yet.</div>
            )}
            {stats.users.map((user) => (
              <div key={user.id} className="flex items-center justify-between bg-yellow-200 rounded-md p-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-gray-700">{user.username || user.email || user.id.slice(0, 6)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${user.status === 'completed' ? 'bg-green-400 text-white' : 'bg-orange-400 text-white'}`}>{user.status === 'completed' ? 'Joined' : 'Pending'}</span>
                </div>
                <span className="text-xs text-gray-500">{user.joined_at ? new Date(user.joined_at).toLocaleDateString() : ''}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="bg-yellow-200 rounded-md p-2">
              <p className="text-xs text-gray-700"><span className="font-bold">{stats.totalReferrals}</span> Total</p>
            </div>
            <div className="bg-green-200 rounded-md p-2">
              <p className="text-xs text-gray-700"><span className="font-bold">₦ {stats.totalRewards?.toLocaleString() || 0}</span> Earned</p>
            </div>
            <div className="bg-orange-200 rounded-md p-2">
              <p className="text-xs text-gray-700"><span className="font-bold">{stats.pendingReferrals}</span> Pending</p>
            </div>
            <div className="bg-blue-200 rounded-md p-2">
              <p className="text-xs text-gray-700"><span className="font-bold">{stats.completedReferrals}</span> Joined</p>
            </div>
          </div>
        </div>

        {/* Compact How to Earn */}
        <div className="bg-white rounded-xl shadow-md p-3">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">How to Earn</h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-5 h-5 rounded-full bg-pink-400 text-white flex items-center justify-center text-xs font-bold mr-2">1</div>
              <p className="text-gray-700 text-sm font-semibold">Share</p>
            </div>
            <p className="text-gray-600 text-xs ml-7">Send your code.</p>
            <div className="flex items-center">
              <div className="w-5 h-5 rounded-full bg-yellow-400 text-blue-800 flex items-center justify-center text-xs font-bold mr-2">2</div>
              <p className="text-gray-700 text-sm font-semibold">Join</p>
            </div>
            <p className="text-gray-600 text-xs ml-7">Friends sign up.</p>
            <div className="flex items-center">
              <div className="w-5 h-5 rounded-full bg-green-400 text-white flex items-center justify-center text-xs font-bold mr-2">3</div>
              <p className="text-gray-700 text-sm font-semibold">Earn</p>
            </div>
            <p className="text-gray-600 text-xs ml-7">Get rewards!</p>
          </div>
        </div>

        {/* Compact Terms */}
        <div className="bg-gray-100 rounded-xl p-2 text-xs text-gray-700">
          <h2 className="font-semibold mb-1">Terms</h2>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>Rewards on sign-up & action.</li>
            <li>Use correct code.</li>
            <li>Rewards may change.</li>
            <li>Bantah manages referrals.</li>
          </ul>
        </div>
      </div>

      <MobileFooterNav />
    </div>
  );
};

export default Referral;