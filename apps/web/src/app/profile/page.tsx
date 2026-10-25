'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Sidebar } from '../../components/Sidebar';
import { DifficultyBadge } from '../../components/DifficultyBadge';
import { UserCheck, Shield, Save, Check } from 'lucide-react';

export default function ProfilePage() {
  const { user, loading, refreshProfile } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        setDisplayName(user.profile?.displayName || user.name);
        setAvatar(user.profile?.avatar || '');
      }
    }
  }, [user, loading, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const res = await api.put('/api/player/profile', { displayName, avatar });
      if (res.data?.success) {
        setSuccess(true);
        await refreshProfile();
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const sampleAvatars = [
    'https://api.dicebear.com/7.x/bottts/svg?seed=ShadowStriker',
    'https://api.dicebear.com/7.x/bottts/svg?seed=CyberNinja',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Valkyrie',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Quantum',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Apex',
  ];

  if (loading || !user) return null;

  return (
    <div className="flex-1 flex">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 max-w-4xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="w-5 h-5 text-indigo-400" />
            <h1 className="text-2xl font-black text-foreground">PLAYER PROFILE</h1>
          </div>
          <p className="text-xs text-muted">Manage your persona and view account authentication parameters.</p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-border">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-background border-2 border-primary/50 p-2">
              <img src={avatar || user.profile?.avatar} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="text-center sm:text-left space-y-2">
              <h2 className="text-xl font-bold text-foreground">{user.profile?.displayName || user.name}</h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <DifficultyBadge level={user.profile?.currentDifficulty || 3} size="sm" />
                <span className="text-xs text-muted font-mono">{user.email}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                  ROLE: {user.role}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase mb-1.5">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full max-w-md px-3 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted uppercase mb-2">Select Avatar</label>
              <div className="flex flex-wrap gap-3">
                {sampleAvatars.map((avUrl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAvatar(avUrl)}
                    className={`w-12 h-12 rounded-xl border p-1 bg-background transition-all ${
                      avatar === avUrl ? 'border-primary scale-110 shadow-md shadow-indigo-600/30' : 'border-border opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={avUrl} alt="Preset" className="w-full h-full" />
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Profile'}
              </button>

              {success && (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-4 h-4" /> Profile updated successfully!
                </span>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
