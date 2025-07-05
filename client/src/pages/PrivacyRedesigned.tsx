import React from 'react';
import { Shield, Lock, Eye, UserCheck, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileFooterNav from '../components/MobileFooterNav';
import PageHeader from '../components/PageHeader';

const PrivacyRedesigned: React.FC = () => {
  const navigate = useNavigate();

  const sections = [
    {
      icon: <Shield className="w-6 h-6 text-primary" />,
      title: 'Data Protection',
      content: 'We employ industry-standard encryption and security measures to protect your personal information and transaction data.',
      details: [
        'End-to-end encryption for all sensitive data',
        'Regular security audits and penetration testing',
        'Compliance with global data protection standards'
      ]
    },
    {
      icon: <Lock className="w-6 h-6 text-primary" />,
      title: 'Account Security',
      content: 'Your account is protected by secure authentication methods with additional security options.',
      details: [
        'Two-factor authentication available',
        'Biometric login support on compatible devices',
        'Suspicious activity monitoring and alerts'
      ]
    },
    {
      icon: <Eye className="w-6 h-6 text-primary" />,
      title: 'Privacy Controls',
      content: 'You have full control over your privacy settings and what information is visible to others.',
      details: [
        'Granular visibility settings for profile information',
        'Betting history and wallet balance are always private',
        'Customizable notification preferences'
      ]
    },
    {
      icon: <UserCheck className="w-6 h-6 text-primary" />,
      title: 'User Rights',
      content: 'You have the right to access, modify, or delete your personal data at any time.',
      details: [
        'Request a copy of all your personal data',
        'Update or correct your information anytime',
        'Request complete account deletion'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-[72px]">
      <PageHeader title="Privacy" />

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Hero section */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-100">
          <div className="flex flex-col items-center text-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Privacy Matters</h1>
            <p className="text-gray-600 max-w-md">
              At Bantah, we're committed to protecting your data and privacy with industry-leading security measures.
            </p>
          </div>
        </div>

        {/* Main content */}
        <div className="space-y-4">
          {sections.map((section, index) => (
            <div key={index} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 transition-all hover:shadow-md">
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex-shrink-0 flex items-center justify-center">
                    {section.icon}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">{section.title}</h2>
                    <p className="text-gray-600 mb-3">{section.content}</p>

                    <ul className="space-y-2">
                      {section.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}


        </div>
      </div>

      <MobileFooterNav />
    </div>
  );
};

export default PrivacyRedesigned;
