import { Head, useForm } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/reset-password', { onFinish: () => reset('password', 'password_confirmation') });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
            <Head title="Reset Password" />
            <Card className="w-full max-w-md border-0 shadow-xl">
                <CardContent className="p-8 space-y-6">
                    <h1 className="text-2xl font-black text-[#1e3a5f] text-center">Set New Password</h1>

                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                            />
                            {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="password">New password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                required
                                autoComplete="new-password"
                            />
                            {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="password_confirmation">Confirm new password</Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                required
                                autoComplete="new-password"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-[#1e3a5f] hover:bg-[#2c5282]"
                        >
                            {processing ? 'Saving…' : 'Reset Password'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
