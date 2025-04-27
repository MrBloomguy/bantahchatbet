import React from 'react';
import { Shield, FileText, Book, AlertCircle, CheckCircle, XCircle, Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileFooterNav from '../components/MobileFooterNav';
import PageHeader from '../components/PageHeader';

const Terms: React.FC = () => {
  const navigate = useNavigate();

  const sections = [
    {
      icon: <CheckCircle className="w-6 h-6 text-primary" />,
      title: 'Acceptable Use',
      content: 'You agree to use our platform only for lawful purposes and in accordance with these Terms.',
      details: [
        'Must be at least 18 years old to use our services',
        'Maintain confidentiality of your account credentials',
        'Use the platform in compliance with all applicable laws'
      ]
    },
    {
      icon: <XCircle className="w-6 h-6 text-primary" />,
      title: 'Prohibited Activities',
      content: 'Users are prohibited from engaging in any fraudulent activity or platform manipulation.',
      details: [
        'No creating multiple accounts or false identities',
        'No harassment or harmful behavior toward other users',
        'No attempts to manipulate events or challenges'
      ]
    },
    {
      icon: <Scale className="w-6 h-6 text-primary" />,
      title: 'Dispute Resolution',
      content: 'All disputes related to challenges and events will be resolved according to our platform rules.',
      details: [
        'Our decision regarding event outcomes is final',
        'Users agree to abide by our dispute resolution process',
        'Disputes must be submitted within 48 hours of event conclusion'
      ]
    },
    {
      icon: <Shield className="w-6 h-6 text-primary" />,
      title: 'Limitation of Liability',
      content: 'We strive to provide a reliable service but cannot guarantee uninterrupted access.',
      details: [
        'Not liable for losses from technical issues',
        'Not responsible for third-party content or links',
        'Maximum liability limited to amounts paid to us'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-[72px]">
      <PageHeader title="Terms of Service" />

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Hero section */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-100">
          <div className="flex flex-col items-center text-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Terms of Service</h1>
            <p className="text-gray-600 max-w-md">
              These Terms govern your access to and use of the Bantah platform. By using our service, you agree to these terms.
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

          {/* Additional Terms Section */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Additional Terms</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-800 mb-1">1. User Accounts</h3>
                <p className="text-gray-600 text-sm">
                  You must register for an account to use certain features. You agree to provide accurate information and are responsible for maintaining the security of your account.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-800 mb-1">2. User Content</h3>
                <p className="text-gray-600 text-sm">
                  You are responsible for all content you post. By posting content, you grant us the right to use, modify, and distribute that content on our platform.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-800 mb-1">3. Virtual Wallet</h3>
                <p className="text-gray-600 text-sm">
                  Our service includes a virtual wallet for funds, wagers, and winnings. All transactions are processed through third-party payment processors.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-800 mb-1">4. Termination</h3>
                <p className="text-gray-600 text-sm">
                  We may terminate or suspend your account without prior notice if you breach these Terms. Upon termination, your right to use the Service will cease.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-800 mb-1">5. Changes to Terms</h3>
                <p className="text-gray-600 text-sm">
                  We may update these Terms at any time. For material changes, we'll provide at least 30 days' notice. Continued use of the service constitutes acceptance of new terms.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-gray-900">Contact Us</h2>
            </div>
            <p className="text-gray-600 mb-2">
              If you have any questions about these Terms, please contact us:
            </p>
            <p className="text-gray-800">
              By email: <a href="mailto:support@bantah.app" className="text-primary hover:underline">support@bantah.app</a>
            </p>
          </div>
        </div>
      </div>

      <MobileFooterNav />
    </div>
  );
};

export default Terms;
