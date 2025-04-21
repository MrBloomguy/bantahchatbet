import React from 'react';
import { ArrowLeft, Shield, Lock, Eye, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileFooterNav from '../components/MobileFooterNav';
import PageHeader from '../components/PageHeader';

const Privacy: React.FC = () => {
  const navigate = useNavigate();

  const sections = [
    {
      icon: <Shield className="w-6 h-6 text-[#CCFF00]" />,
      title: 'Data Protection',
      content: 'We employ industry-standard encryption and security measures to protect your personal information and transaction data. Your data is stored securely and is never shared with third parties without your explicit consent.'
    },
    {
      icon: <Lock className="w-6 h-6 text-[#CCFF00]" />,
      title: 'Account Security',
      content: 'Your account is protected by secure authentication methods. We recommend enabling two-factor authentication for additional security. Regular security audits are performed to ensure the safety of your account.'
    },
    {
      icon: <Eye className="w-6 h-6 text-[#CCFF00]" />,
      title: 'Privacy Controls',
      content: 'You have full control over your privacy settings. Choose what information is visible to others and manage your notification preferences. Your betting history and wallet balance are always kept private.'
    },
    {
      icon: <UserCheck className="w-6 h-6 text-[#CCFF00]" />,
      title: 'User Rights',
      content: 'You have the right to access, modify, or delete your personal data at any time. Contact our support team for assistance with data-related requests. We comply with all applicable data protection regulations.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F6F7FB] pb-[72px]">
       <PageHeader title="Privacy" />

      <div className="p-4 max-w-2xl mx-auto space-y-6">
        {sections.map((section, index) => (
          <div key={index} className="bg-[#242538] rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#CCFF00]/20 flex items-center justify-center">
                {section.icon}
              </div>
              <h2 className="text-white font-bold text-lg">{section.title}</h2>
            </div>
            <p className="text-white/60 leading-relaxed">{section.content}</p>
          </div>
        ))}

        {/* Additional Information */}
        <div className="bg-[#242538] rounded-xl p-6">
          <h2 className="text-white font-bold text-lg mb-4">Your Privacy Matters</h2>
          <div className="space-y-4 text-white/60">
            <p>
              At Bantah, we take your privacy seriously. Our platform is built with security and privacy in mind, ensuring that your personal information and betting activities are protected.
            </p>
            <p>
              We use advanced encryption technologies and follow industry best practices to safeguard your data. Our privacy policy is regularly updated to reflect the latest security measures and regulations.
            </p>
            <p>
              If you have any questions or concerns about your privacy, please don't hesitate to contact the Bantah support team.
            </p>
          </div>
        </div>
      </div>

      <MobileFooterNav />
    </div>
  );
};

export default Privacy;