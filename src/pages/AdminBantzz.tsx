import React, { useState, useEffect } from 'react';
import { Sparkles, BarChart2, RefreshCw } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { getBantzzConfig, updateBantzzConfig } from '../api/bantzz-ai';

const mockStats = {
  totalQuestions: 1234,
  totalUsers: 321,
  avgResponseTime: '1.8s',
  lastActive: 'Just now',
};

const LLM_TYPES = [
  { value: 'openai', label: 'OpenAI (GPT-3.5/4)' },
  { value: 'azure', label: 'Azure OpenAI' },
  { value: 'gemini', label: 'Google Gemini' },
];

const AdminBantzz: React.FC = () => {
  const [stats, setStats] = useState(mockStats);
  const [systemPrompt, setSystemPrompt] = useState(
    'You are Bantzz, the official AI agent for Bantah. Answer questions about Bantah, its features, rules, and community.'
  );
  const [saving, setSaving] = useState(false);
  const [llmType, setLlmType] = useState('openai');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [llmSaving, setLlmSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    // Fetch config from backend
    getBantzzConfig().then(cfg => {
      setSystemPrompt(cfg.systemPrompt);
      setLlmType(cfg.llmType);
      setEnabled(cfg.enabled);
    });
  }, []);

  // Simulate save
  const handleSavePrompt = async () => {
    setSaving(true);
    try {
      await updateBantzzConfig({ systemPrompt, llmType, llmApiKey, enabled });
    } finally {
      setSaving(false);
    }
  };

  // Simulate refresh
  const handleRefreshStats = () => {
    // In real app, fetch stats from backend
    setStats({ ...mockStats, lastActive: 'Just now' });
  };

  const handleSaveLlm = async () => {
    setLlmSaving(true);
    try {
      await updateBantzzConfig({ systemPrompt, llmType, llmApiKey, enabled });
    } finally {
      setLlmSaving(false);
    }
  };

  const handleEnable = async (val: boolean) => {
    setEnabled(val);
    await updateBantzzConfig({ systemPrompt, llmType, llmApiKey, enabled: val });
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
          <Sparkles className="w-7 h-7 text-[#7440ff]" /> Bantzz AI Agent Admin
        </h1>
        <div className="bg-white rounded-xl shadow p-5 mb-8">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-[#7440ff]" /> Agent Stats
            <button onClick={handleRefreshStats} className="ml-auto text-xs flex items-center gap-1 text-[#7440ff] hover:underline">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="font-medium">Total Questions</div>
            <div>{stats.totalQuestions}</div>
            <div className="font-medium">Total Users</div>
            <div>{stats.totalUsers}</div>
            <div className="font-medium">Avg. Response Time</div>
            <div>{stats.avgResponseTime}</div>
            <div className="font-medium">Last Active</div>
            <div>{stats.lastActive}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-5 mb-8">
          <h2 className="text-lg font-semibold mb-3">System Prompt</h2>
          <textarea
            className="w-full border rounded p-2 text-sm min-h-[80px]"
            value={systemPrompt}
            onChange={e => setSystemPrompt(e.target.value)}
          />
          <button
            onClick={handleSavePrompt}
            className="mt-3 px-4 py-2 bg-[#7440ff] text-white rounded font-semibold hover:bg-[#6030ff] transition-colors"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Prompt'}
          </button>
        </div>
        <div className="bg-white rounded-xl shadow p-5 mb-8">
          <h2 className="text-lg font-semibold mb-3">LLM Provider & API Key</h2>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Model Provider</label>
            <select
              className="w-full border rounded p-2 text-sm"
              value={llmType}
              onChange={e => setLlmType(e.target.value)}
            >
              {LLM_TYPES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">API Key</label>
            <input
              type="password"
              className="w-full border rounded p-2 text-sm"
              value={llmApiKey}
              onChange={e => setLlmApiKey(e.target.value)}
              placeholder="Enter API key..."
            />
          </div>
          <button
            onClick={handleSaveLlm}
            className="px-4 py-2 bg-[#7440ff] text-white rounded font-semibold hover:bg-[#6030ff] transition-colors"
            disabled={llmSaving}
          >
            {llmSaving ? 'Saving...' : 'Save LLM Settings'}
          </button>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold mb-3">Agent Controls</h2>
          <div className="flex gap-3">
            <button
              className="px-4 py-2 bg-green-500 text-white rounded font-semibold hover:bg-green-600 transition-colors"
              disabled={enabled}
              onClick={() => handleEnable(true)}
            >Enable Agent</button>
            <button
              className="px-4 py-2 bg-red-500 text-white rounded font-semibold hover:bg-red-600 transition-colors"
              disabled={!enabled}
              onClick={() => handleEnable(false)}
            >Disable Agent</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminBantzz;
