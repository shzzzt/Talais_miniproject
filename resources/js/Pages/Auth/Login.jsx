import { Head, Link, useForm } from '@inertiajs/react';
import { GraduationCap, Shield, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        login: '',
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
        <div className="relative flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-hidden bg-slate-100 lg:flex-row">
            <Head title="Sign In" />

            {/* Decorative background (mobile + form side) */}
            <div
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom_right,#f8fafc_0%,#e8eef6_45%,#f1f5f9_100%)]"
                aria-hidden
            />
            <div
                className="pointer-events-none absolute -left-32 top-0 h-80 w-80 rounded-full bg-[#1e3a5f]/10 blur-3xl"
                aria-hidden
            />
            <div
                className="pointer-events-none absolute -right-16 bottom-0 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl"
                aria-hidden
            />
            <div
                className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%231e3a5f%22%20fill-opacity%3D%220.04%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-80"
                aria-hidden
            />

            {/* Brand panel — large screens only (wider ~4/7 of row) */}
            <aside
                className="relative z-[1] hidden min-h-0 min-w-0 flex-col self-stretch border-r border-white/10 bg-gradient-to-br from-[#142a45] via-[#1e3a5f] to-[#254a73] text-white shadow-2xl shadow-[#0f1f33]/40 lg:flex lg:h-full lg:flex-[4]"
                aria-hidden
            >
                <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-sky-400/15 blur-3xl" />
                <div className="pointer-events-none absolute -top-16 right-12 h-48 w-48 rounded-full bg-white/5 blur-2xl" />

                <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain px-10 py-12 xl:px-14 2xl:px-20">
                    <div className="mx-auto my-auto w-full max-w-2xl space-y-12 lg:mx-0 xl:max-w-3xl 2xl:max-w-4xl">
                        <header className="flex flex-col gap-6 border-b border-white/15 pb-10 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur sm:h-16 sm:w-16">
                                    <GraduationCap
                                        className="h-8 w-8 text-white sm:h-9 sm:w-9"
                                        strokeWidth={1.65}
                                    />
                                </div>
                                <div>
                                    <p className="text-xl font-bold tracking-tight text-white sm:text-2xl">TALAIS</p>
                                    <p className="mt-0.5 text-sm font-medium leading-snug text-slate-300/95">
                                        Learning information system
                                    </p>
                                </div>
                            </div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-200/80">
                                Enrollment · Records · Insights
                            </p>
                        </header>

                        <div className="grid gap-10 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:gap-x-14 xl:gap-y-0 xl:items-start">
                            <div className="space-y-5">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-200/85">
                                    Why sign in
                                </p>
                                <h2 className="text-balance text-3xl font-semibold leading-[1.12] tracking-tight text-white sm:text-[2rem] xl:text-[2.125rem]">
                                    Secure access for parents, guardians, and school staff.
                                </h2>
                                <p className="max-w-xl text-[0.9375rem] leading-relaxed text-slate-300/95">
                                    View enrollments, learner updates, and school records together—organized for clarity
                                    and managed by your school.
                                </p>
                            </div>

                            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 xl:gap-5">
                                <li className="flex gap-4 rounded-2xl bg-white/[0.07] p-5 ring-1 ring-white/12 backdrop-blur-sm">
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                                        <Sparkles className="h-5 w-5 text-amber-200/95" />
                                    </span>
                                    <div className="min-w-0 space-y-1 pt-0.5">
                                        <p className="text-sm font-semibold text-white">Learner journeys</p>
                                        <p className="text-sm leading-relaxed text-slate-200/90">
                                            Streamlined enrollment and clear learner profiles.
                                        </p>
                                    </div>
                                </li>
                                <li className="flex gap-4 rounded-2xl bg-white/[0.07] p-5 ring-1 ring-white/12 backdrop-blur-sm">
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                                        <Shield className="h-5 w-5 text-emerald-200/95" />
                                    </span>
                                    <div className="min-w-0 space-y-1 pt-0.5">
                                        <p className="text-sm font-semibold text-white">School-controlled access</p>
                                        <p className="text-sm leading-relaxed text-slate-200/90">
                                            Privacy-focused permissions your registrar and IT team manage.
                                        </p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <footer className="relative shrink-0 border-t border-white/10 px-10 py-5 xl:px-14 2xl:px-20">
                    <p className="text-xs text-slate-400/95">© {new Date().getFullYear()} TALAIS</p>
                </footer>
            </aside>

            <main className="relative z-[1] flex min-h-0 w-full flex-1 min-w-0 flex-col overflow-y-auto overscroll-y-contain px-4 py-10 sm:px-6 lg:h-full lg:flex-[3] lg:px-10 lg:py-12 xl:px-14 2xl:px-16">
                <div className="mx-auto my-auto w-full max-w-[28rem] space-y-8">
                    {/* Mobile-only brand strip */}
                    <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white/60 px-4 py-3 shadow-sm backdrop-blur-sm lg:hidden">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1e3a5f] text-white shadow-md shadow-[#1e3a5f]/25">
                            <GraduationCap className="h-5 w-5" strokeWidth={1.75} />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold text-slate-900">TALAIS</p>
                            <p className="text-[11px] text-slate-500">Parent & guardian portal</p>
                        </div>
                    </div>

                    <div className="space-y-2 text-center sm:text-left">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1e3a5f]/75">
                            Welcome back
                        </p>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.75rem]">
                            Sign in to your account
                        </h1>
                        <p className="text-sm leading-relaxed text-slate-600">
                            Use the email{' '}
                            <span className="whitespace-nowrap">or mobile number</span> you registered with, plus your
                            password.
                        </p>
                    </div>

                    <Card className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white/85 shadow-xl shadow-slate-900/[0.07] backdrop-blur-sm ring-1 ring-white/60">
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#1e3a5f]/20 to-transparent" />
                        <CardContent className="space-y-6 p-6 sm:p-8">
                            {status && (
                                <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/90 px-3 py-2.5 text-center text-sm font-medium text-emerald-900">
                                    {status}
                                </div>
                            )}

                            <form onSubmit={submit} className="space-y-5">
                                <div className="space-y-1.5">
                                    <Label htmlFor="login">Email or mobile number</Label>
                                    <Input
                                        id="login"
                                        type="text"
                                        value={data.login}
                                        autoComplete="username"
                                        autoFocus
                                        onChange={(e) => setData('login', e.target.value)}
                                        required
                                        className="h-11 rounded-xl border-slate-200/90 bg-white shadow-inner shadow-slate-900/[0.02] transition-[box-shadow,border-color] focus-visible:border-[#1e3a5f]/40 focus-visible:ring-[#1e3a5f]/25"
                                        placeholder="name@school.edu.ph or 09*********"
                                    />
                                    {errors.login && (
                                        <p className="text-xs text-red-600">{errors.login}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <Label htmlFor="password">Password</Label>
                                        {canResetPassword && (
                                            <Link
                                                href="/forgot-password"
                                                className="text-xs font-medium text-[#1e3a5f] hover:text-[#2c5282] hover:underline"
                                            >
                                                Forgot password?
                                            </Link>
                                        )}
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        autoComplete="current-password"
                                        onChange={(e) => setData('password', e.target.value)}
                                        required
                                        className="h-11 rounded-xl border-slate-200/90 bg-white shadow-inner shadow-slate-900/[0.02] transition-[box-shadow,border-color] focus-visible:border-[#1e3a5f]/40 focus-visible:ring-[#1e3a5f]/25"
                                    />
                                    {errors.password && (
                                        <p className="text-xs text-red-600">{errors.password}</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="remember"
                                        checked={data.remember}
                                        onCheckedChange={(checked) =>
                                            setData('remember', checked === true)
                                        }
                                        className="border-slate-300 data-[state=checked]:border-[#1e3a5f] data-[state=checked]:bg-[#1e3a5f]"
                                    />
                                    <Label
                                        htmlFor="remember"
                                        className="cursor-pointer text-sm font-normal text-slate-600"
                                    >
                                        Remember this device
                                    </Label>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="h-11 w-full rounded-xl bg-[#1e3a5f] text-base font-semibold shadow-lg shadow-[#1e3a5f]/25 transition hover:bg-[#2c5282] hover:shadow-xl hover:shadow-[#1e3a5f]/30"
                                >
                                    {processing ? 'Signing in…' : 'Sign in'}
                                </Button>
                            </form>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-slate-200/90" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase tracking-wider">
                                    <span className="bg-card/95 px-3 text-slate-400">New parent?</span>
                                </div>
                            </div>

                            <p className="text-center text-sm text-slate-600">
                                Register as a parent or guardian to enroll learners.{' '}
                                <Link
                                    href="/register"
                                    className="font-semibold text-[#1e3a5f] hover:text-[#2c5282] hover:underline"
                                >
                                    Create an account
                                </Link>
                            </p>
                        </CardContent>
                    </Card>

                    <p className="text-center text-xs text-slate-500 sm:text-left">
                        Having trouble? Contact your school registrar or IT office.
                    </p>
                </div>
            </main>
        </div>
    );
}
