'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { User, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export default function SettingsPage() {
  const { data: session } = useSession();

  const [name, setName] = useState(session?.user?.name || '');
  const [nameSuccess, setNameSuccess] = useState('');
  const [nameError, setNameError] = useState('');
  const [nameLoading, setNameLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameSuccess('');
    setNameError('');
    if (!name.trim()) {
      setNameError('Name cannot be empty');
      return;
    }
    setNameLoading(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        setNameSuccess('Profile updated successfully');
      } else {
        const data = await res.json();
        setNameError(data.error || 'Failed to update profile');
      }
    } catch {
      setNameError('Failed to update profile');
    } finally {
      setNameLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        setPasswordSuccess('Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        const data = await res.json();
        setPasswordError(data.error || 'Failed to update password');
      }
    } catch {
      setPasswordError('Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-secondary text-sm mt-1">Manage your account preferences</p>
      </div>

      {/* Profile */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Profile</h2>
              <p className="text-text-muted text-xs">{session?.user?.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <Input
              label="Full name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            {nameSuccess && (
              <div className="flex items-center gap-2 text-gain text-sm">
                <CheckCircle className="w-4 h-4" />
                {nameSuccess}
              </div>
            )}
            {nameError && (
              <div className="flex items-center gap-2 text-loss text-sm">
                <AlertCircle className="w-4 h-4" />
                {nameError}
              </div>
            )}

            <Button type="submit" loading={nameLoading}>
              Update Profile
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
              <Lock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Change Password</h2>
              <p className="text-text-muted text-xs">Use a strong, unique password</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <Input
              label="Current password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <Input
              label="New password"
              type="password"
              placeholder="Min. 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            <Input
              label="Confirm new password"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
              autoComplete="new-password"
              error={confirmNewPassword && newPassword !== confirmNewPassword ? 'Passwords do not match' : ''}
            />

            {passwordSuccess && (
              <div className="flex items-center gap-2 text-gain text-sm">
                <CheckCircle className="w-4 h-4" />
                {passwordSuccess}
              </div>
            )}
            {passwordError && (
              <div className="flex items-center gap-2 text-loss text-sm">
                <AlertCircle className="w-4 h-4" />
                {passwordError}
              </div>
            )}

            <Button type="submit" loading={passwordLoading}>
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account info */}
      <div className="mt-6 p-4 bg-surface border border-border rounded-2xl">
        <h3 className="text-sm font-medium text-text-secondary mb-3">Account Info</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Email</span>
            <span className="text-text-primary">{session?.user?.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Member since</span>
            <span className="text-text-primary">
              {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
