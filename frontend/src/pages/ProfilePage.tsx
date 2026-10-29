import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { UserCheck, CheckCircle2, AlertCircle, Shield } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').trim(),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address').trim(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      await updateProfile(data);
      setSuccessMessage('Profile updated successfully!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update profile');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account Profile</h1>
        <p className="text-sm text-slate-500">Manage your personal information and view access roles</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-indigo-600" />
            <span>Profile Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Account Role Badge Notice */}
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-sm font-semibold text-slate-900">System Role</span>
                <span className="text-xs text-slate-500">
                  Defines global privileges and administrative controls
                </span>
              </div>
            </div>
            <Badge variant={user?.role === 'ADMIN' ? 'default' : 'secondary'} className="text-xs px-3 py-1">
              {user?.role}
            </Badge>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name *"
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="Email Address *"
              type="email"
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="pt-2">
              <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
