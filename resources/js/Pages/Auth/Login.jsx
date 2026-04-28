import { Head, Link, useForm } from '@inertiajs/react';
import { GraduationCap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post('/login', {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
            <Head title="Sign In" />
            <Card className="w-full max-w-md border-0 shadow-xl">
                <CardContent className="p-8 space-y-6">
                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-400">
                            <GraduationCap className="w-7 h-7 text-[#1e3a5f]" />
                        </div>
                        <h1 className="text-2xl font-black text-[#1e3a5f]">TALAIS</h1>
                        <p className="text-xs text-slate-500">Musuan Integrated School</p>
                    </div>

                    {status && (
                        <div className="text-sm font-medium text-emerald-600 text-center">{status}</div>
                    )}

                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                autoComplete="username"
                                autoFocus
                                onChange={(e) => setData('email', e.target.value)}
                                required
                            />
                            {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={data.password}
                                autoComplete="current-password"
                                onChange={(e) => setData('password', e.target.value)}
                                required
                            />
                            {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="rounded border-slate-300"
                                />
                                <span className="text-slate-600">Remember me</span>
                            </label>
                            {canResetPassword && (
                                <Link href="/forgot-password" className="text-[#1e3a5f] hover:underline">
                                    Forgot password?
                                </Link>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-[#1e3a5f] hover:bg-[#2c5282]"
                        >
                            {processing ? 'Signing in…' : 'Sign In'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
