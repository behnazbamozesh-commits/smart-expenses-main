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
import { validateEmail, validatePassword } from '@/lib/validations';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();
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

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      toast.error(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      toast.error(t('passwordsDoNotMatch'));
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error.message);
        toast.error(error.message);
        setLoading(false);
      } else {
        toast.success(isRTL ? 'ثبت‌نام موفق!' : 'Account created!', {
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
        });
        setSuccess(true);
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError(isRTL ? 'خطا در ثبت‌نام' : 'Signup failed');
      toast.error(isRTL ? 'خطا در ثبت‌نام' : 'Signup failed');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="w-full max-w-md">
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                <h2 className={`text-xl font-semibold text-white mb-2 ${isRTL ? 'font-vazir' : ''}`}>{t('checkYourEmail')}</h2>
                <p className={`text-slate-400 mb-6 ${isRTL ? 'font-vazir' : ''}`}>
                  {t('weSentConfirmation')} <span className="text-emerald-400">{email}</span>
                </p>
                <Link href="/auth/login">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    {t('backToLogin')}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Smart Expense Tracker</h1>
          <p className={`text-slate-400 ${isRTL ? 'font-vazir' : ''}`}>{isRTL ? 'هزینه‌های خود را آسان ردیابی کنید' : 'Start tracking your expenses today'}</p>
        </div>
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle className={`text-white ${isRTL ? 'font-vazir' : ''}`}>{t('createAccount')}</CardTitle>
            <CardDescription className={`text-slate-400 ${isRTL ? 'font-vazir' : ''}`}>
              {isRTL ? 'جزئیات خود را وارد کنید' : 'Enter your details to get started'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                  <AlertCircle className="h-4 w-4" />
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
                {password.length > 0 && (
                  <div className="text-xs space-y-1">
                    <p className={password.length >= 6 ? 'text-emerald-400' : 'text-slate-500'}>
                      {isRTL ? 'حداقل ۶ کاراکتر' : 'At least 6 characters'}
                    </p>
                    <p className={/[a-zA-Z]/.test(password) ? 'text-emerald-400' : 'text-slate-500'}>
                      {isRTL ? 'حداقل یک حرف' : 'At least one letter'}
                    </p>
                    <p className={/[0-9]/.test(password) ? 'text-emerald-400' : 'text-slate-500'}>
                      {isRTL ? 'حداقل یک عدد' : 'At least one number'}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className={`text-slate-300 ${isRTL ? 'font-vazir' : ''}`}>{t('confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-amber-400">{t('passwordsDoNotMatch')}</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isRTL ? 'در حال ایجاد...' : 'Creating account...'}
                  </>
                ) : (
                  t('createAccount')
                )}
              </Button>
            </form>
            <div className="mt-6 pt-6 border-t border-slate-700 text-center">
              <p className={`text-slate-400 text-sm ${isRTL ? 'font-vazir' : ''}`}>
                {isRTL ? 'حساب دارید؟' : 'Already have an account?'}{' '}
                <Link href="/auth/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
                  {t('signIn')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
