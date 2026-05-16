import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({ password: '' });

    const submit = (e) => {
        e.preventDefault();
        post('/confirm-password', { onFinish: () => reset('password') });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
            <Head title="Confirm Password" />
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-4">
                <h1 className="text-xl font-black text-[var(--theme-primary)]">Confirm Password</h1>
                <p className="text-sm text-slate-600">
                    This is a secure area. Please confirm your password before continuing.
                </p>

                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            autoFocus
                            autoComplete="current-password"
                            required
                        />
                        {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
                    </div>
                    <Button type="submit" disabled={processing} className="w-full bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)]">
                        Confirm
                    </Button>
                </form>
            </div>
        </div>
    );
}
