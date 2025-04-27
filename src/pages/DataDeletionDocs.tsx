import React from 'react';
import { ArrowLeft, Code, Server, Globe, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import MobileFooterNav from '../components/MobileFooterNav';

const DataDeletionDocs: React.FC = () => {
  const navigate = useNavigate();
  const baseUrl = window.location.origin;

  return (
    <div className="min-h-screen bg-gray-50 pb-[72px]">
      <PageHeader title="Data Deletion API" />

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-100">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Code className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Data Deletion API Documentation</h1>
            <p className="text-gray-600 max-w-md">
              This documentation explains how external applications can implement data deletion requests for Bantah users.
            </p>
          </div>

          <div className="flex justify-start mb-6">
            <button
              type="button"
              onClick={() => navigate('/settings/data-deletion')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Data Deletion
            </button>
          </div>

          <div className="prose max-w-none">
            <h2>Overview</h2>
            <p>
              In compliance with privacy regulations, Bantah provides multiple ways for users to request deletion of their personal data.
              External applications that access Bantah user data must implement at least one of these methods.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-3">
                  <Globe className="h-6 w-6 text-blue-500 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900 m-0">Callback URL</h3>
                </div>
                <p className="text-gray-600 text-sm m-0">
                  Redirect users to our data deletion callback URL to let them request data deletion through our interface.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-3">
                  <Server className="h-6 w-6 text-green-500 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900 m-0">API Endpoint</h3>
                </div>
                <p className="text-gray-600 text-sm m-0">
                  Make server-to-server API calls to programmatically submit data deletion requests on behalf of users.
                </p>
              </div>
            </div>

            <h2 className="mt-8">Method 1: Callback URL</h2>
            <p>
              The simplest way to implement data deletion is to redirect users to our data deletion callback URL.
              This allows users to confirm and submit their deletion request through our interface.
            </p>

            <h3>URL Format</h3>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-3 overflow-x-auto">
              <code className="text-sm text-gray-800 whitespace-nowrap">
                {baseUrl}/data-deletion-callback?user_id=USER_ID&app_id=YOUR_APP_ID&token=YOUR_TOKEN&source=external
              </code>
            </div>

            <h3>Parameters</h3>
            <ul>
              <li><strong>user_id</strong> (required): The Bantah user ID</li>
              <li><strong>app_id</strong> (required): Your application ID (provided by Bantah)</li>
              <li><strong>token</strong> (required): Your API token (provided by Bantah)</li>
              <li><strong>source</strong> (optional): Set to "external" to identify the source</li>
            </ul>

            <h3>Example Implementation</h3>
            <div className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
                {`// HTML Button Example
<button onclick="redirectToDataDeletion()">Delete My Data</button>

<script>
  function redirectToDataDeletion() {
    const userId = "user-123"; // The user's Bantah ID
    const appId = "your-app-id"; // Your app ID
    const token = "your-api-token"; // Your API token
    
    window.location.href = "${baseUrl}/data-deletion-callback?user_id=" + 
      userId + "&app_id=" + appId + "&token=" + token + "&source=external";
  }
</script>`}
              </pre>
            </div>

            <h2 className="mt-8">Method 2: API Endpoint</h2>
            <p>
              For server-side applications, you can use our API endpoint to programmatically submit data deletion requests.
            </p>

            <h3>Endpoint</h3>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-3">
              <code className="text-sm text-gray-800">
                POST {baseUrl}/api/data-deletion
              </code>
            </div>

            <h3>Request Body</h3>
            <div className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
                {`{
  "user_id": "user-123",  // The user's Bantah ID
  "app_id": "your-app-id", // Your app ID
  "token": "your-api-token" // Your API token
}`}
              </pre>
            </div>

            <h3>Response</h3>
            <div className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
                {`// Success Response
{
  "success": true,
  "message": "Data deletion request submitted successfully",
  "request_id": "user-123-1619712345678",
  "estimated_completion_days": 30
}

// Error Response
{
  "success": false,
  "error": "Invalid token"
}`}
              </pre>
            </div>

            <h3>Example Implementation</h3>
            <div className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
                {`// Node.js Example
const axios = require('axios');

async function requestDataDeletion(userId) {
  try {
    const response = await axios.post('${baseUrl}/api/data-deletion', {
      user_id: userId,
      app_id: 'your-app-id',
      token: 'your-api-token'
    });
    
    console.log('Deletion request submitted:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error submitting deletion request:', error.response?.data || error.message);
    throw error;
  }
}`}
              </pre>
            </div>

            <h2 className="mt-8">Getting Access</h2>
            <p>
              To use these APIs, you need to register your application with Bantah and obtain an app ID and API token.
              Please contact <a href="mailto:developers@bantah.app" className="text-primary hover:text-primary-dark">developers@bantah.app</a> to request access.
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Shield className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Security Note:</strong> Keep your API token secure and never expose it in client-side code.
                    For client-side applications, we recommend using the callback URL method instead of the API endpoint.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MobileFooterNav />
    </div>
  );
};

export default DataDeletionDocs;
