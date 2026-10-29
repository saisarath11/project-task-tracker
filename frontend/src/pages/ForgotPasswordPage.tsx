import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../api/auth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Layers, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const [devToken, setDevToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      const res = await authApi.forgotPassword(data);
      setSuccessMessage(res.message);
      if (res.devResetToken) {
        setDevToken(res.devResetToken);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to request password reset');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex p-3 bg-indigo-600 rounded-2xl text-white shadow-lg mb-4">
          <Layers className="h-8 w-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Reset Password</h2>
        <p className="mt-2 text-sm text-slate-600">
          Enter your registered email address to receive password reset instructions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-lg">
          <CardContent className="p-8">
            {successMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-4 text-sm text-emerald-800">
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Request Processed</span>
                </div>
                <p>{successMessage}</p>

                {devToken && (
                  <div className="mt-3 p-3 bg-white border border-emerald-300 rounded-lg">
                    <span className="block text-xs font-bold text-emerald-700 uppercase mb-1">
                      Development Mode Reset Token:
                    </span>
                    <code className="text-xs break-all bg-slate-100 p-1.5 rounded block text-slate-800 font-mono">
                      {devToken}
                    </code>
                    <div className="mt-3">
                      <Link
                        to={`/reset-password?token=${devToken}`}
                        className="inline-block text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
                      >
                        Proceed directly to password reset form &rarr;
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-sm text-rose-700 mb-4">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Registered Email Address"
                type="email"
                placeholder="you@company.com"
                error={errors.email?.message}
                {...register('email')}
              />

              <Button
                type="submit"
                className="w-full mt-2"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                Send Reset Instructions
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
