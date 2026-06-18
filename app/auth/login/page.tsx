'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CircleAlert as AlertCircle, Loader as Loader2, CircleCheck as CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { validateEmail } from '@/lib/validations';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();
  const { t, isRTL } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      toast.error(emailError);
      return;
    }

    if (password.length < 6) {
      setError(t('passwordMustBe6Chars'));
      toast.error(t('passwordMustBe6Chars'));
      return;
    }

    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
        toast.error(error.message);
        setLoading(false);
      } else {
        toast.success(isRTL ? 'ورود موفق!' : 'Login successful!', {
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
        });
        router.push('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(isRTL ? 'خطا در ورود' : 'Login failed');
      toast.error(isRTL ? 'خطا در ورود' : 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Smart Expense Tracker</h1>
          <p className={`text-slate-400 ${isRTL ? 'font-vazir' : ''}`}>{t('welcomeBack')}</p>
        </div>
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle className={`text-white ${isRTL ? 'font-vazir' : ''}`}>{t('signIn')}</CardTitle>
            <CardDescription className={`text-slate-400 ${isRTL ? 'font-vazir' : ''}`}>
              {t('enterCredentials')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className={`text-slate-300 ${isRTL ? 'font-vazir' : ''}`}>{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500 ${isRTL ? 'text-right' : ''}`}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className={`text-slate-300 ${isRTL ? 'font-vazir' : ''}`}>{t('password')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500"
                />
                {password.length > 0 && password.length < 6 && (
                  <p className="text-xs text-amber-400">{t('passwordMustBe6Chars')}</p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <Link href="/auth/forgot-password" className={`text-sm text-emerald-400 hover:text-emerald-300 ${isRTL ? 'font-vazir' : ''}`}>
                  {t('forgotPassword')}
                </Link>
              </div>
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('signingIn')}
                  </>
                ) : (
                  t('signIn')
                )}
              </Button>
            </form>
            <div className="mt-6 pt-6 border-t border-slate-700 text-center">
              <p className={`text-slate-400 text-sm ${isRTL ? 'font-vazir' : ''}`}>
                {isRTL ? 'حساب ندارید؟' : "Don't have an account?"}{' '}
                <Link href="/auth/signup" className="text-emerald-400 hover:text-emerald-300 font-medium">
                  {t('createAccount')}
                </Link>
              </p>
            </div>
            <div className="mt-4 text-center">
              <Link href="/" className={`text-sm text-slate-500 hover:text-slate-300 ${isRTL ? 'font-vazir' : ''}`}>
                {t('tryDemoMode')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
