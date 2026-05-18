import { Head, Link, useForm } from '@inertiajs/react';
import React from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const inputClass = 'h-11 bg-white';
const selectTriggerClass = 'h-11 bg-white';

function RegistrationStepper({ step }) {
  const labels = ['Account', 'Guardian'];

  return (
    <div className="mx-auto w-full max-w-lg select-none">
      <div className="flex items-center">
        {[1, 2].map((n, idx) => (
          <React.Fragment key={n}>
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors',
                step > n && 'border-[#1e3a5f] bg-[#1e3a5f] text-white',
                step === n && 'border-[#1e3a5f] bg-white text-[#1e3a5f] shadow-md shadow-[#1e3a5f]/15',
                step < n && 'border-slate-200 bg-white text-slate-400',
              )}
            >
              {step > n ? <Check className="h-5 w-5" strokeWidth={2.5} /> : n}
            </div>
            {idx < 1 && (
              <div className={cn('mx-2 h-1 flex-1 rounded-full', step > n ? 'bg-[#1e3a5f]' : 'bg-slate-200')} />
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1 text-center">
        {labels.map((label, i) => (
          <span
            key={label}
            className={cn(
              'text-[11px] font-semibold uppercase tracking-wide',
              step === i + 1 ? 'text-[#1e3a5f]' : 'text-slate-500',
            )}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Register() {
  const [step, setStep] = React.useState(1);

  const { data, setData, post, processing, errors, reset } = useForm({
    login_method: 'email',
    email: '',
    phone_number: '',
    password: '',
    password_confirmation: '',
    guardian: {
      first_name: '',
      middle_name: '',
      last_name: '',
      relationship: '',
      contact_number: '',
      email: '',
      mother_tongue: '',
      ip_ethnic_group: '',
      religion: '',
      house_street_sitio: '',
      barangay: '',
      municipality_city: '',
      province: '',
    },
  });

  const updateGuardian = (patch) => {
    setData('guardian', { ...data.guardian, ...patch });
  };

  const primaryAccountFilled =
    data.login_method === 'email' ? !!data.email.trim() : !!data.phone_number.trim();
  const canGoStep2 = primaryAccountFilled && !!data.password && !!data.password_confirmation;
  const canSubmit = !!data.guardian.first_name && !!data.guardian.last_name && !!data.guardian.relationship;

  const stepBlurb =
    step === 1
      ? 'Pick how you will sign in: email or mobile. That one is required; you may add the other as optional.'
      : 'We use guardian details on official school records.';

  const submit = (e) => {
    e.preventDefault();
    post('/register', {
      preserveScroll: true,
      onFinish: () => reset('password', 'password_confirmation'),
    });
  };

  const errorList = Object.values(errors ?? {}).slice(0, 5);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/95">
      <Head title="Parent registration" />

      <main className="flex flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mx-auto w-full max-w-2xl flex-1 space-y-8 pb-12">
          <div className="space-y-1 text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1e3a5f]/80">
              Parent / guardian
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.75rem]">
              Create your TALAIS account
            </h1>
            <p className="max-w-xl text-sm text-slate-500 lg:max-w-none">
              Two short steps: account, then guardian details.
            </p>
          </div>

          <Card className="border border-slate-200/80 shadow-xl shadow-slate-900/5">
            <CardContent className="space-y-6 p-6 sm:p-8">
              <RegistrationStepper step={step} />
              <p className="text-center text-sm leading-relaxed text-slate-600 lg:text-left">{stepBlurb}</p>
              <Separator />

              <form onSubmit={submit} className="space-y-6">
                {errorList.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    {errorList.map((message, index) => (
                      <p key={index}>{message}</p>
                    ))}
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-4">
                    <RadioGroup
                      value={data.login_method}
                      onValueChange={(value) => setData('login_method', value)}
                      className="grid gap-3 sm:grid-cols-2"
                    >
                      <label
                        htmlFor="login-email"
                        className={cn(
                          'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                          data.login_method === 'email'
                            ? 'border-[#1e3a5f] bg-[#1e3a5f]/[0.06]'
                            : 'border-slate-200 hover:border-slate-300',
                        )}
                      >
                        <RadioGroupItem value="email" id="login-email" className="mt-0.5" />
                        <span>
                          <span className="block text-sm font-semibold text-slate-900">Email</span>
                          <span className="text-xs text-slate-500">Address you check regularly</span>
                        </span>
                      </label>
                      <label
                        htmlFor="login-phone"
                        className={cn(
                          'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                          data.login_method === 'phone'
                            ? 'border-[#1e3a5f] bg-[#1e3a5f]/[0.06]'
                            : 'border-slate-200 hover:border-slate-300',
                        )}
                      >
                        <RadioGroupItem value="phone" id="login-phone" className="mt-0.5" />
                        <span>
                          <span className="block text-sm font-semibold text-slate-900">Mobile number</span>
                          <span className="text-xs text-slate-500">PH mobile you can access</span>
                        </span>
                      </label>
                    </RadioGroup>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={data.email}
                          autoComplete="email"
                          className={inputClass}
                          onChange={(e) => setData('email', e.target.value)}
                          placeholder="you@example.com"
                        />
                        {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="phone_number">Mobile number</Label>
                        <Input
                          id="phone_number"
                          type="tel"
                          inputMode="tel"
                          value={data.phone_number}
                          autoComplete="tel"
                          className={inputClass}
                          onChange={(e) => setData('phone_number', e.target.value)}
                          placeholder="09XXXXXXXXX"
                        />
                        {errors.phone_number && <p className="text-xs text-red-600">{errors.phone_number}</p>}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={data.password}
                          autoComplete="new-password"
                          className={inputClass}
                          onChange={(e) => setData('password', e.target.value)}
                        />
                        {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="password_confirmation">Confirm password</Label>
                        <Input
                          id="password_confirmation"
                          type="password"
                          value={data.password_confirmation}
                          autoComplete="new-password"
                          className={inputClass}
                          onChange={(e) => setData('password_confirmation', e.target.value)}
                        />
                      </div>
                    </div>

                    <Button
                      type="button"
                      className="h-11 w-full bg-[#1e3a5f] text-base font-semibold shadow-md shadow-[#1e3a5f]/25 hover:bg-[#2c5282]"
                      disabled={!canGoStep2}
                      onClick={() => {
                        if (data.phone_number && !data.guardian.contact_number) {
                          updateGuardian({ contact_number: data.phone_number });
                        }
                        setStep(2);
                      }}
                    >
                      Continue
                    </Button>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2 space-y-1.5 sm:col-span-1">
                        <Label>First name</Label>
                        <Input
                          value={data.guardian.first_name}
                          className={inputClass}
                          onChange={(e) => updateGuardian({ first_name: e.target.value })}
                        />
                        {errors['guardian.first_name'] && (
                          <p className="text-xs text-red-600">{errors['guardian.first_name']}</p>
                        )}
                      </div>
                      <div className="col-span-2 space-y-1.5 sm:col-span-1">
                        <Label>Last name</Label>
                        <Input
                          value={data.guardian.last_name}
                          className={inputClass}
                          onChange={(e) => updateGuardian({ last_name: e.target.value })}
                        />
                        {errors['guardian.last_name'] && (
                          <p className="text-xs text-red-600">{errors['guardian.last_name']}</p>
                        )}
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label>Middle name</Label>
                        <Input
                          value={data.guardian.middle_name}
                          className={inputClass}
                          onChange={(e) => updateGuardian({ middle_name: e.target.value })}
                        />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label>Relationship</Label>
                        <Select
                          value={data.guardian.relationship || undefined}
                          onValueChange={(value) => updateGuardian({ relationship: value })}
                        >
                          <SelectTrigger className={selectTriggerClass}>
                            <SelectValue placeholder="Select relationship" />
                          </SelectTrigger>
                          <SelectContent>
                            {['Father', 'Mother', 'Legal Guardian', 'Other'].map((item) => (
                              <SelectItem key={item} value={item}>
                                {item}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors['guardian.relationship'] && (
                          <p className="text-xs text-red-600">{errors['guardian.relationship']}</p>
                        )}
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label>Contact number</Label>
                        <Input
                          value={data.guardian.contact_number}
                          className={inputClass}
                          onChange={(e) => updateGuardian({ contact_number: e.target.value })}
                        />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={data.guardian.email}
                          className={inputClass}
                          onChange={(e) => updateGuardian({ email: e.target.value })}
                        />
                      </div>
                      <div className="col-span-2 border-t border-slate-100 pt-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#1e3a5f]/90">
                          Current address
                        </p>
                      </div>
                      {['house_street_sitio', 'barangay', 'municipality_city', 'province'].map((field) => (
                        <div key={field} className="col-span-2 space-y-1.5">
                          <Label>{field.replaceAll('_', ' ')}</Label>
                          <Input
                            value={data.guardian[field] ?? ''}
                            className={inputClass}
                            onChange={(e) => updateGuardian({ [field]: e.target.value })}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-11 flex-1">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={processing || !canSubmit}
                        className="h-11 flex-1 bg-[#1e3a5f] font-semibold shadow-md shadow-[#1e3a5f]/25 hover:bg-[#2c5282]"
                      >
                        {processing ? 'Submitting...' : 'Submit and finish'}
                      </Button>
                    </div>
                  </div>
                )}
              </form>

              <Separator />

              <p className="text-center text-sm text-slate-600">
                Already registered?{' '}
                <Link href="/login" className="font-semibold text-[#1e3a5f] hover:text-[#2c5282] hover:underline">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-slate-400 sm:text-left">
            Having trouble? Contact your school registrar or IT office.
          </p>
        </div>
      </main>
    </div>
  );
}
