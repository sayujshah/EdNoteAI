'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '../../components/AuthGuard'; // Import AuthGuard - Adjust path

interface UserSettings {
  visual_analysis_enabled: boolean;
  export_format: string; // Assuming string for now, will use enum later
  // Add other settings here
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Function to fetch user settings
  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/settings');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch settings');
      }
      const data: UserSettings = await response.json();
      setSettings(data);
    } catch (error: any) {
      setError(error.message);
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []); // Empty dependency array means this runs once on mount

  // Function to handle settings changes
  const handleSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target; // Remove checked from destructuring
    setSettings((prevSettings) => {
      if (!prevSettings) return null;
      const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value; // Cast to HTMLInputElement for checked
      return {
        ...prevSettings,
        [name]: newValue,
      };
    });
    setSaveSuccess(false); // Reset save success message on change
  };

  // Function to save settings
  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      setSaveSuccess(true);
    } catch (error: any) {
      setError(error.message);
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading settings...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (!settings) return <p>Settings not found.</p>; // Should ideally create default settings on user signup

  return (
    <AuthGuard> {/* Wrap content with AuthGuard */}
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">User Settings</h1>

        <form onSubmit={saveSettings}>
          {/* Visual Analysis Enabled setting */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              <input
                type="checkbox"
                name="visual_analysis_enabled"
                checked={settings.visual_analysis_enabled}
                onChange={handleSettingChange}
                className="mr-2 leading-tight"
                disabled={saving}
              />
              <span className="text-sm">Enable Visual Analysis</span>
            </label>
          </div>

          {/* Export Format setting */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="export_format">
              Export Format:
            </label>
            <select
              id="export_format"
              name="export_format"
              value={settings.export_format}
              onChange={handleSettingChange}
              className="border rounded px-3 py-2 text-gray-700"
              disabled={saving}
            >
              <option value="markdown">Markdown</option>
              <option value="latex">LaTeX</option>
              <option value="docx">Word (.docx)</option>
              <option value="txt">Plain Text (.txt)</option>
            </select>
          </div>

          {/* TODO: Add other settings here */}

          <button
            type="submit"
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>

          {saveSuccess && <p className="mt-2 text-green-500">Settings saved successfully!</p>}
          {error && <p className="mt-2 text-red-500">Error saving settings: {error}</p>}
        </form>
      </div>
    </AuthGuard>
  );
}
