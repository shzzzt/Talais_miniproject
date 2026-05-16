import { Head, Link, useForm } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    const submit = (e) => {
        e.preventDefault();
        post('/forgot-password');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
            <Head title="Forgot Password" />
            <Card className="w-full max-w-md border-0 shadow-xl">
                <CardContent className="p-8 space-y-6">
                    <div className="text-center space-y-1">
                        <h1 className="text-2xl font-black text-[var(--theme-primary)]">Reset Password</h1>
                        <p className="text-sm text-slate-500">
                            Enter your email and we&apos;ll send you a reset link.
                        </p>
                    </div>

                    {status && (
                        <div className="text-sm text-emerald-600 text-center">{status}</div>
                    )}

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

                        <Button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)]"
                        >
                            {processing ? 'Sending…' : 'Email Password Reset Link'}
                        </Button>

                        <p className="text-center text-sm">
                            <Link href="/login" className="text-slate-600 hover:underline">
                                Back to sign in
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
