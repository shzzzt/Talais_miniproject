import { Head, useForm, Link } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TwoFactorChallenge({ contactHint, status }) {
    const { data, setData, post, processing, errors, reset } = useForm({ code: '' });

    const submit = (e) => {
        e.preventDefault();
        post('/two-factor-challenge', { onFinish: () => reset('code') });
    };

    const resend = () => {
        post('/two-factor-challenge/resend');
    };

    const cancel = () => {
        post('/two-factor-challenge/cancel');
    };

    const destination = contactHint ? (
        <span className="font-semibold text-slate-700">{contactHint}</span>
    ) : (
        <span className="font-semibold text-slate-700">your account</span>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
            <Head title="Two-Factor Verification" />
            <Card className="w-full max-w-md border-0 shadow-xl">
                <CardContent className="p-8 space-y-5">
                    <div className="text-center space-y-1">
                        <h1 className="text-2xl font-black text-[var(--theme-primary)]">Verify Your Identity</h1>
                        <p className="text-sm text-slate-500">
                            We sent a 6-digit verification code to {destination}.
                        </p>
                    </div>

                    {status && (
                        <div className="text-sm text-emerald-600 text-center">{status}</div>
                    )}

                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="code">Verification code</Label>
                            <Input
                                id="code"
                                type="text"
                                inputMode="numeric"
                                pattern="\d{6}"
                                maxLength={6}
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value.replace(/\D/g, ''))}
                                autoFocus
                                required
                                className="text-center text-2xl tracking-[0.5em]"
                            />
                            {errors.code && <p className="text-xs text-red-600">{errors.code}</p>}
                        </div>

                        <Button
                            type="submit"
                            disabled={processing || data.code.length !== 6}
                            className="w-full bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)]"
                        >
                            {processing ? 'Verifying…' : 'Verify and Sign In'}
                        </Button>
                    </form>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                        <button type="button" onClick={resend} className="hover:underline">
                            Resend code
                        </button>
                        <button type="button" onClick={cancel} className="hover:underline text-red-500">
                            Cancel sign-in
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
