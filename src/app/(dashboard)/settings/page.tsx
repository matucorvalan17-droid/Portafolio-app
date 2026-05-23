'use client';

import { useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { User, Lock, CheckCircle, AlertCircle, Camera, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 256;
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width  = img.width  * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();

  const [name,       setName]       = useState(session?.user?.name  ?? '');
  const [email,      setEmail]      = useState(session?.user?.email ?? '');
  const [avatarSrc,  setAvatarSrc]  = useState<string>((session?.user as { image?: string | null } | undefined)?.image ?? '');
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword,    setCurrentPassword]    = useState('');
  const [newPassword,        setNewPassword]        = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading,    setPasswordLoading]    = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = (session?.user?.name ?? session?.user?.email ?? '?')
    .split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB');
      return;
    }
    try {
      const compressed = await compressImage(file);
      setAvatarSrc(compressed);
      toast.success('Photo selected — click "Save Changes" to apply');
    } catch {
      toast.error('Could not process image');
    }
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Name cannot be empty'); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email'); return;
    }
    setProfileLoading(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), image: avatarSrc }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to update profile'); return; }
      await updateSession({ name: data.name, email: data.email, image: data.image });
      toast.success('Profile updated!');
      if (data.email !== session?.user?.email) {
        toast.info('Email changed — you may need to sign in again');
      }
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) { toast.error('Passwords do not match'); return; }
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setPasswordLoading(true);
    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        toast.success('Password updated successfully');
        setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update password');
      }
    } catch {
      toast.error('Failed to update password');
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
              <p className="text-text-muted text-xs">Update your name, email and photo</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Avatar */}
          <div className="flex items-center gap-5 mb-6">
            <div className="relative group">
              <div
                className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-border cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarSrc ? (
                  <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">{initials}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary mb-1">Profile photo</p>
              <p className="text-xs text-text-muted mb-2">JPG, PNG or GIF · max 5 MB</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-primary hover:underline font-medium"
              >
                Upload new photo
              </button>
              {avatarSrc && (
                <button
                  type="button"
                  onClick={() => setAvatarSrc('')}
                  className="ml-4 text-xs text-loss hover:underline font-medium"
                >
                  Remove
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <Input
              label="Full name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <div className="relative">
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Mail className="absolute right-3 top-9 w-4 h-4 text-text-muted pointer-events-none" />
            </div>

            <Button type="submit" loading={profileLoading}>
              Save Changes
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
