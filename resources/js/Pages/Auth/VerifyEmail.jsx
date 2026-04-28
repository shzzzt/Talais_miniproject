import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm();

    const submit = (e) => {
        e.preventDefault();
        post('/email/verification-notification');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
            <Head title="Verify Email" />
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-4">
                <h1 className="text-2xl font-black text-[#1e3a5f]">Verify your email</h1>
                <p className="text-sm text-slate-600 leading-relaxed">
                    Thanks for signing up. Before getting started, please verify your email by
                    clicking the link in the message we just sent you. Didn&apos;t receive it?
                    Request another below.
                </p>
                {status === 'verification-link-sent' && (
                    <div className="text-sm text-emerald-600">
                        A new verification link has been sent to your email.
                    </div>
                )}
                <form onSubmit={submit} className="flex items-center justify-between">
                    <Button type="submit" disabled={processing} className="bg-[#1e3a5f] hover:bg-[#2c5282]">
                        Resend Verification Email
                    </Button>
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="text-sm text-slate-500 hover:underline"
                    >
                        Sign out
                    </Link>
                </form>
            </div>
        </div>
    );
}
