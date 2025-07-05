
import React from 'react';
import PageHeader from '../components/PageHeader';
import MobileFooterNav from '../components/MobileFooterNav';
import NotificationTester from '../components/NotificationTester';

const NotificationTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Notification Testing" showBack />
      
      <div className="pt-16 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Test Notifications
            </h1>
            <p className="text-gray-600">
              Use this page to test how notifications work when you receive messages 
              from other groups or direct messages while you're in a chatroom.
            </p>
          </div>

          <NotificationTester />

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">
              💡 Testing Instructions:
            </h3>
            <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
              <li>Go to any chatroom (Messages page)</li>
              <li>Come back to this page</li>
              <li>Click any test button above</li>
              <li>You should see a toast notification appear</li>
              <li>The notification will show even if you're in a different chat</li>
            </ol>
          </div>

          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">
              ✅ Expected Behavior:
            </h3>
            <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
              <li>Toast notifications appear in the top-right corner</li>
              <li>Different notification types have different colors</li>
              <li>Challenge notifications include a "View" button</li>
              <li>Notifications persist for 8 seconds</li>
              <li>Your unread count increases automatically</li>
            </ul>
          </div>
        </div>
      </div>

      <MobileFooterNav />
    </div>
  );
};

export default NotificationTest;
