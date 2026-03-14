'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/auth/AuthGuard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

function ProfileContent() {
  const { logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    api.get<UserProfile>('/users/me').then(({ data }) => {
      setProfile(data);
      setName(data.name ?? '');
      setEmail(data.email);
    });
  }, []);

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      const { data } = await api.patch<UserProfile>('/users/me', { name, email });
      setProfile(data);
      setProfileMsg({ ok: true, text: 'Perfil actualizado correctamente' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setProfileMsg({ ok: false, text: typeof msg === 'string' ? msg : 'Error al actualizar el perfil' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('¿Seguro que quieres darte de baja? Se eliminarán tu cuenta y todos tus gráficos. Esta acción no se puede deshacer.')) return;
    try {
      await api.delete('/users/me');
      logout();
      router.push('/login');
    } catch {
      // silent
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMsg(null);
    try {
      await api.patch('/users/me/password', { current_password: currentPassword, new_password: newPassword });
      setPasswordMsg({ ok: true, text: 'Contraseña actualizada correctamente' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setPasswordMsg({ ok: false, text: typeof msg === 'string' ? msg : 'Error al cambiar la contraseña' });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-text-muted hover:text-text transition-colors text-sm">
          ← Dashboard
        </Link>
        <h1 className="text-lg font-bold text-text font-mono">Mi perfil</h1>
      </header>

      <main className="max-w-lg mx-auto px-6 py-8 flex flex-col gap-6">
        {/* Profile info */}
        <div className="bg-surface-2 border border-border rounded-lg p-6">
          <h2 className="text-xs font-semibold text-text-muted uppercase font-mono tracking-wider mb-4">
            Información personal
          </h2>
          <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
            <Input
              label="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {profileMsg && (
              <p className={`text-sm ${profileMsg.ok ? 'text-teal' : 'text-red-400'}`}>
                {profileMsg.text}
              </p>
            )}
            {profile && (
              <div className="flex gap-3 text-xs text-text-muted font-mono">
                <span>Rol: <span className="text-text">{profile.role}</span></span>
                <span>Estado: <span className="text-text">{profile.status}</span></span>
              </div>
            )}
            <Button type="submit" loading={profileLoading} className="self-start">
              Guardar cambios
            </Button>
          </form>
        </div>

        {/* Change password */}
        <div className="bg-surface-2 border border-border rounded-lg p-6">
          <h2 className="text-xs font-semibold text-text-muted uppercase font-mono tracking-wider mb-4">
            Cambiar contraseña
          </h2>
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
            <Input
              label="Contraseña actual"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <Input
              label="Nueva contraseña"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
            />
            {passwordMsg && (
              <p className={`text-sm ${passwordMsg.ok ? 'text-teal' : 'text-red-400'}`}>
                {passwordMsg.text}
              </p>
            )}
            <Button
              type="submit"
              loading={passwordLoading}
              disabled={newPassword.length > 0 && newPassword.length < 8}
              className="self-start"
            >
              Cambiar contraseña
            </Button>
          </form>
        </div>
        {/* Delete account */}
        <div className="bg-surface-2 border border-red-400/20 rounded-lg p-6">
          <h2 className="text-xs font-semibold text-red-400/80 uppercase font-mono tracking-wider mb-2">
            Zona de peligro
          </h2>
          <p className="text-xs text-text-muted mb-4">
            Al darte de baja se eliminarán permanentemente tu cuenta y todos tus gráficos.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="text-sm text-red-400 border border-red-400/30 rounded px-4 py-2 hover:bg-red-400/10 transition-colors"
          >
            Darme de baja
          </button>
        </div>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}
