import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Layers, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setErrorMessage(null);
      await login(data);
      navigate('/');
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password');
    }
  };

  const handleQuickLogin = (email: string) => {
    setValue('email', email);
    setValue('password', 'Password123!');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex p-3 bg-indigo-600 rounded-2xl text-white shadow-lg mb-4">
          <Layers className="h-8 w-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">TaskPulse</h2>
        <p className="mt-2 text-sm text-slate-600">
          Sign in to manage projects, tasks, and team productivity
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-sm text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <Input
                label="Email Address"
                type="email"
                placeholder="you@company.com"
                error={errors.email?.message}
                {...register('email')}
              />

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register('password')}
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-2"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                Sign In
              </Button>
            </form>

            {/* Demo Quick Logins */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">
                Evaluation Demo Accounts
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@taskpulse.io')}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-800 font-medium text-left transition-colors border border-slate-200"
                >
                  <span className="block font-bold text-indigo-600">Admin</span>
                  <span className="text-[11px] text-slate-500 truncate block">admin@taskpulse.io</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('sarah@taskpulse.io')}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-800 font-medium text-left transition-colors border border-slate-200"
                >
                  <span className="block font-bold text-slate-800">Sarah (Owner)</span>
                  <span className="text-[11px] text-slate-500 truncate block">sarah@taskpulse.io</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('john@taskpulse.io')}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-800 font-medium text-left transition-colors border border-slate-200"
                >
                  <span className="block font-bold text-slate-800">John (Member)</span>
                  <span className="text-[11px] text-slate-500 truncate block">john@taskpulse.io</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('emily@taskpulse.io')}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-800 font-medium text-left transition-colors border border-slate-200"
                >
                  <span className="block font-bold text-slate-800">Emily (Member)</span>
                  <span className="text-[11px] text-slate-500 truncate block">emily@taskpulse.io</span>
                </button>
              </div>
            </div>

            <div className="mt-6 text-center text-sm text-slate-600">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
                Register here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
