import AppLayout from '@/Layouts/AppLayout';
import React, { useRef, useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import { Camera, Save, User } from 'lucide-react';
import { base44 } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/shared/PageHeader';
import { toast } from 'sonner';

export default function EditProfile({ mustVerifyEmail, status }) {
  const fileInputRef = useRef(null);
  const { auth } = usePage().props;
  const user = auth?.user ?? {};
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
    name: user.name ?? '',
    email: user.email ?? '',
    phone_number: user.phone_number ?? '',
    avatar: user.avatar ?? '',
  });

  const submit = (event) => {
    event.preventDefault();
    patch('/profile', {
      preserveScroll: true,
      onSuccess: () => toast.success('Profile saved'),
      onError: () => toast.error('Please check the profile fields.'),
    });
  };

  const uploadAvatar = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setData('avatar', file_url);
      router.patch('/profile', {
        name: data.name,
        email: data.email,
        phone_number: data.phone_number,
        avatar: file_url,
      }, {
        preserveScroll: true,
        onSuccess: () => toast.success('Profile picture updated'),
        onError: () => toast.error('Profile picture uploaded, but saving it failed.'),
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to upload profile picture.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeAvatar = () => {
    setData('avatar', '');
    router.patch('/profile', {
      name: data.name,
      email: data.email,
      phone_number: data.phone_number,
      avatar: '',
    }, {
      preserveScroll: true,
      onSuccess: () => toast.success('Profile picture removed'),
      onError: () => toast.error('Failed to remove profile picture.'),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Account Profile" description="Update your account details and profile picture." />

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm">Profile Picture</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-5 sm:items-center">
          <div className="w-24 h-24 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
            {data.avatar
              ? <img src={data.avatar} alt="Profile" className="w-full h-full object-cover" />
              : <User className="w-10 h-10 text-slate-300" />}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} isLoading={uploadingAvatar} loadingText="Uploading...">
                <Camera className="w-4 h-4 mr-2" /> Upload Picture
              </Button>
              {data.avatar && (
                <Button type="button" variant="ghost" className="text-red-600 hover:text-red-700" onClick={removeAvatar}>
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-slate-400">Use a clear square image. JPG, PNG, and WebP are supported.</p>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm">Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4 max-w-xl">
            <div>
              <Label>Name</Label>
              <Input className="mt-1" value={data.name} onChange={(event) => setData('name', event.target.value)} />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label>Email</Label>
              <Input className="mt-1" type="email" value={data.email ?? ''} onChange={(event) => setData('email', event.target.value)} />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>
            {user.role === 'parent' && (
              <div>
                <Label>Phone Number</Label>
                <Input className="mt-1" value={data.phone_number ?? ''} onChange={(event) => setData('phone_number', event.target.value)} />
                {errors.phone_number && <p className="text-xs text-red-600 mt-1">{errors.phone_number}</p>}
              </div>
            )}
            {mustVerifyEmail && user.email_verified_at === null && (
              <p className="text-xs text-amber-600">Your email address is unverified.</p>
            )}
            {status && <p className="text-xs text-emerald-600">{status}</p>}
            <div className="flex items-center gap-3">
              <Button type="submit" className="bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)]" isLoading={processing} loadingText="Saving...">
                <Save className="w-4 h-4 mr-2" /> Save Profile
              </Button>
              {recentlySuccessful && <span className="text-xs text-emerald-600">Saved.</span>}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

EditProfile.layout = (page) => <AppLayout currentPageName="Profile">{page}</AppLayout>;
