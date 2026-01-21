
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { UserProfile } from '../types';

const ResumeManager: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    targetRole: '',
    resumeText: ''
  });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const saved = storageService.getState().profile;
    if (saved) setProfile(saved);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.updateProfile(profile);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-2xl mx-auto shadow-sm">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">AI Targeting Profile</h2>
        <p className="text-slate-500">Provide your background so JobSentry can draft personalized messages for you.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Full Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={e => setProfile({...profile, name: e.target.value})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="Alex Smith"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Target Role</label>
            <input
              type="text"
              value={profile.targetRole}
              onChange={e => setProfile({...profile, targetRole: e.target.value})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="Senior Frontend Engineer"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Experience / Resume Summary</label>
          <textarea
            value={profile.resumeText}
            onChange={e => setProfile({...profile, resumeText: e.target.value})}
            className="w-full h-64 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none text-sm leading-relaxed"
            placeholder="Paste your resume content or a summary of your key achievements here..."
            required
          />
        </div>

        <button
          type="submit"
          className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-lg ${
            isSaved ? 'bg-green-600 scale-[0.98]' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 hover:shadow-indigo-200'
          }`}
        >
          {isSaved ? '✓ Profile Saved' : 'Save AI Profile'}
        </button>
      </form>
    </div>
  );
};

export default ResumeManager;
