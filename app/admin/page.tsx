'use client';

import { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, Trash2, KeyRound, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { CATEGORIES } from '@/lib/categories';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin', {
        headers: { 'x-admin-secret': password },
      });
      const data = await res.json();

      if (res.ok) {
        setIsAuthenticated(true);
        setEntries(data.entries || []);
      } else {
        setError('Invalid admin secret key');
      }
    } catch {
      setError('Failed to authenticate');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshEntries = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin', {
        headers: { 'x-admin-secret': password },
      });
      const data = await res.json();
      if (res.ok) {
        setEntries(data.entries || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleHide = async (url: string, currentHidden: boolean) => {
    try {
      await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': password,
        },
        body: JSON.stringify({
          action: 'toggle_visibility',
          url,
          is_hidden: !currentHidden,
        }),
      });
      refreshEntries();
    } catch {}
  };

  const handleCategoryChange = async (url: string, newCategory: string) => {
    try {
      await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': password,
        },
        body: JSON.stringify({
          action: 'update_category',
          url,
          category: newCategory,
        }),
      });
      refreshEntries();
    } catch {}
  };

  const handleDelete = async (url: string) => {
    if (!confirm(`Are you sure you want to permanently delete listing "${url}"?`)) return;

    try {
      await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': password,
        },
        body: JSON.stringify({
          action: 'delete',
          url,
        }),
      });
      refreshEntries();
    } catch {}
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
        <Card className="w-full max-w-sm p-6 border-border bg-card rounded-2xl shadow-md">
          <div className="flex items-center justify-center size-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mx-auto mb-4">
            <Shield className="size-6" />
          </div>
          <h2 className="text-lg font-bold text-center">Admin Moderation</h2>
          <p className="text-xs text-muted-foreground text-center mt-1">
            Enter the admin secret key to access moderation controls.
          </p>

          <form onSubmit={handleLogin} className="space-y-3 mt-5">
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Admin Secret Key"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 h-10 text-xs rounded-xl"
              />
            </div>
            {error && <p className="text-xs text-destructive text-center">{error}</p>}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 rounded-xl text-xs font-semibold bg-foreground text-background"
            >
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : 'Enter Dashboard'}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="size-5 text-amber-500" />
            <h1 className="text-xl font-bold">Admin Moderation Panel</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Moderate listings, hide policy violations, and reassign categories.
          </p>
        </div>

        <Button
          onClick={refreshEntries}
          disabled={isLoading}
          variant="outline"
          className="h-9 px-3 text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        {entries.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-12">No listings found in database.</p>
        ) : (
          entries.map((entry) => (
            <Card
              key={entry.url}
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                entry.is_hidden ? 'opacity-60 bg-muted/40 border-dashed border-destructive/40' : 'bg-card border-border'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-foreground">
                    ${(entry.bid_cents / 100).toFixed(0)}
                  </span>
                  <span className="font-semibold text-sm text-foreground truncate">
                    {entry.name}
                  </span>
                  {entry.is_hidden && (
                    <span className="text-[10px] font-mono text-destructive bg-destructive/10 px-1.5 py-0.5 rounded border border-destructive/20">
                      HIDDEN
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <a
                    href={entry.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground font-mono truncate max-w-sm flex items-center gap-1"
                  >
                    <span>{entry.url}</span>
                    <ExternalLink className="size-3 shrink-0" />
                  </a>
                </div>
              </div>

              {/* Category Selector & Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={entry.category || 'other'}
                  onChange={(e) => handleCategoryChange(entry.url, e.target.value)}
                  className="h-8 text-xs bg-background rounded-lg border border-border px-2 text-foreground outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleHide(entry.url, Boolean(entry.is_hidden))}
                  className="h-8 px-2.5 text-xs rounded-lg cursor-pointer"
                  title={entry.is_hidden ? 'Unhide listing' : 'Hide listing'}
                >
                  {entry.is_hidden ? (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <Eye className="size-3.5" /> Unhide
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <EyeOff className="size-3.5" /> Hide
                    </span>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(entry.url)}
                  className="h-8 px-2.5 text-xs rounded-lg cursor-pointer"
                  title="Permanently Delete"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
