import { Link } from '@inertiajs/react';
import { GraduationCap } from 'lucide-react';

export default function Welcome({ canLogin, canRegister }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e3a5f] via-[#2c5282] to-[#1e3a5f] p-6">
            <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-10 text-center space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-400 mx-auto">
                    <GraduationCap className="w-10 h-10 text-[#1e3a5f]" />
                </div>
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-[#1e3a5f]">TALAIS</h1>
                    <p className="text-slate-500 mt-2">Musuan Integrated School Information System</p>
                </div>
                <p className="text-slate-600 leading-relaxed max-w-lg mx-auto">
                    A web-based, secure, and centralized system for managing student records,
                    grades, attendance, and DepEd reporting forms.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                    {canLogin && (
                        <Link
                            href="/login"
                            className="px-5 py-2.5 rounded-lg bg-[#1e3a5f] text-white text-sm font-semibold hover:bg-[#2c5282] transition-colors"
                        >
                            Sign In
                        </Link>
                    )}
                    {canRegister && (
                        <Link
                            href="/register"
                            className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
                        >
                            Register
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
