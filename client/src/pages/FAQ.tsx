import React from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileFooterNav from '../components/MobileFooterNav';

const FAQ: React.FC = () => {
  const navigate = useNavigate();
  const [openSection, setOpenSection] = React.useState<string | null>(null);

  const faqSections = [
    {
      id: 'general',
      title: 'General Questions',
      items: [
        {
          question: 'How do I create an event?',
          answer: 'To create an event, click the "+" button in the navigation bar and select "Create Event". Fill in the event details including title, description, category, and betting rules.'
        },
        {
          question: 'How do deposits and withdrawals work?',
          answer: 'You can deposit funds using bank transfer or card payment. Withdrawals are processed within 24 hours and sent directly to your registered bank account.'
        },
        {
          question: 'What happens if I win a bet?',
          answer: 'When you win a bet, your winnings are automatically credited to your wallet. The amount depends on the total pool and number of winners.'
        }
      ]
    },
    {
      id: 'account',
      title: 'Account & Security',
      items: [
        {
          question: 'How do I change my password?',
          answer: 'Go to Settings > Security > Change Password. Enter your current password and your new password twice to confirm.'
        },
        {
          question: 'What should I do if I forget my password?',
          answer: 'Click on "Forgot Password" on the login page. Enter your email address and follow the instructions sent to reset your password.'
        }
      ]
    },
    {
      id: 'events',
      title: 'Events & Betting',
      items: [
        {
          question: 'How are winners determined?',
          answer: 'Winners are determined based on the event outcome and betting rules specified by the event creator. All results are verified before payouts.'
        },
        {
          question: 'Can I cancel my bet?',
          answer: 'Bets can only be cancelled before the event starts. Once an event begins, all bets are final.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#1a1b2e] pb-24">
      <header className="bg-[#242538] text-white p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">FAQ</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        <div className="space-y-4">
          {faqSections.map((section) => (
            <div key={section.id} className="bg-[#242538] rounded-lg overflow-hidden">
              <button
                className="w-full p-4 text-left text-white flex justify-between items-center"
                onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
              >
                <h2 className="text-lg font-semibold">{section.title}</h2>
                <ChevronDown 
                  className={`w-5 h-5 transition-transform ${
                    openSection === section.id ? 'transform rotate-180' : ''
                  }`}
                />
              </button>
              
              {openSection === section.id && (
                <div className="px-4 pb-4">
                  {section.items.map((item, index) => (
                    <div key={index} className="mb-4 last:mb-0">
                      <h3 className="text-[#CCFF00] font-medium mb-2">{item.question}</h3>
                      <p className="text-white/60 text-sm">{item.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <MobileFooterNav />
    </div>
  );
};

export default FAQ;