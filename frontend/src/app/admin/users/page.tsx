'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/auth/AuthGuard';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

const ROLES = ['USER', 'ADMIN'];
const STATUSES = ['ACTIVE', 'INACTIVE', 'BANNED'];

function AdminUsersContent() {
  const { role } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (role !== 'ADMIN') {
      router.replace('/dashboard');
      return;
    }
    api.get<AdminUser[]>('/users').then(({ data }) => {
      setUsers(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [role, router]);

  const update = async (userId: string, field: 'role' | 'status', value: string) => {
    setUpdating(userId);
    try {
      const { data } = await api.patch<AdminUser>(`/users/${userId}`, { [field]: value });
      setUsers((prev) => prev.map((u) => (u.id === data.id ? data : u)));
    } catch {
      // silent — user stays as-is
    } finally {
      setUpdating(null);
    }
  };

  const deleteUser = async (userId: string, email: string) => {
    if (!confirm(`¿Eliminar el usuario ${email}? Esta acción no se puede deshacer.`)) return;
    setDeleting(userId);
    try {
      await api.delete(`/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  };

  if (role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-text-muted hover:text-text transition-colors text-sm">
          ← Dashboard
        </Link>
        <h1 className="text-lg font-bold text-text font-mono">Gestión de usuarios</h1>
        {!loading && (
          <span className="text-xs text-text-muted font-mono ml-auto">
            {users.length} usuario{users.length !== 1 ? 's' : ''}
          </span>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : (
          <div className="bg-surface-2 border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase font-mono tracking-wider">
                    Usuario
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase font-mono tracking-wider">
                    Rol
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase font-mono tracking-wider">
                    Estado
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase font-mono tracking-wider hidden sm:table-cell">
                    Creado
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-0 hover:bg-surface-3 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-text font-medium">{user.name ?? '—'}</p>
                      <p className="text-text-muted text-xs">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        disabled={updating === user.id}
                        onChange={(e) => update(user.id, 'role', e.target.value)}
                        className="bg-surface border border-border rounded px-2 py-1 text-xs text-text font-mono disabled:opacity-50 cursor-pointer"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={user.status}
                        disabled={updating === user.id}
                        onChange={(e) => update(user.id, 'status', e.target.value)}
                        className={`bg-surface border rounded px-2 py-1 text-xs font-mono disabled:opacity-50 cursor-pointer ${
                          user.status === 'ACTIVE'
                            ? 'border-teal/40 text-teal'
                            : user.status === 'BANNED'
                            ? 'border-red-400/40 text-red-400'
                            : 'border-border text-text-muted'
                        }`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs hidden sm:table-cell font-mono">
                      {new Date(user.created_at).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteUser(user.id, user.email)}
                        disabled={deleting === user.id || updating === user.id}
                        className="text-xs text-red-400 hover:text-red-300 disabled:opacity-40 transition-colors font-mono"
                      >
                        {deleting === user.id ? '...' : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <AuthGuard>
      <AdminUsersContent />
    </AuthGuard>
  );
}
