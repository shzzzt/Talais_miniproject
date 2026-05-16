import { Head, Link, useForm } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
<<<<<<< Updated upstream
=======
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ArrowLeft, Check, Plus, Trash2 } from 'lucide-react';
import React from 'react';

const emptyChild = () => ({
  first_name: '',
  middle_name: '',
  last_name: '',
  suffix: '',
  birth_date: '',
  gender: '',
  lrn: '',
  birth_place: '',
  mother_tongue: '',
  ip_ethnic_group: '',
  religion: '',
  house_street_sitio: '',
  barangay: '',
  municipality_city: '',
  province: '',
  same_address_as_guardian: false,
});

const inputClass = 'h-11 bg-white';
const selectTriggerClass = 'h-11 bg-white';

function RegistrationStepper({ step }) {
  const labels = ['Account', 'Guardian', 'Learners'];
  return (
    <div className="w-full max-w-lg mx-auto select-none">
      <div className="flex items-center">
        {[1, 2, 3].map((n, idx) => (
          <React.Fragment key={n}>
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors',
                step > n && 'border-[var(--theme-primary)] bg-[var(--theme-primary)] text-white',
                step === n &&
                  'border-[var(--theme-primary)] bg-white text-[var(--theme-primary)] shadow-md shadow-[#1e3a5f]/15',
                step < n && 'border-slate-200 bg-white text-slate-400',
              )}
            >
              {step > n ? <Check className="h-5 w-5" strokeWidth={2.5} /> : n}
            </div>
            {idx < 2 && (
              <div
                className={cn(
                  'mx-2 h-1 min-h-[2px] flex-1 rounded-full',
                  step > n ? 'bg-[var(--theme-primary)]' : 'bg-slate-200',
                )}
                aria-hidden
              />
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1 text-center">
        {labels.map((label, i) => (
          <span
            key={label}
            className={cn(
              'text-[11px] font-semibold uppercase tracking-wide',
              step === i + 1 ? 'text-[var(--theme-primary)]' : 'text-slate-500',
            )}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
>>>>>>> Stashed changes

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/register', {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

<<<<<<< Updated upstream
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
            <Head title="Register" />
            <Card className="w-full max-w-md border-0 shadow-xl">
                <CardContent className="p-8 space-y-6">
                    <div className="text-center space-y-1">
                        <h1 className="text-2xl font-black text-[#1e3a5f]">Create Account</h1>
                        <p className="text-xs text-slate-500">
                            New users default to the parent role and require admin activation.
                        </p>
=======
  const canGoStep2 =
    primaryAccountFilled && !!data.password && !!data.password_confirmation;
  const canGoStep3 =
    !!data.guardian.first_name &&
    !!data.guardian.last_name &&
    !!data.guardian.relationship &&
    !!data.children.length &&
    data.children.every((c) => c.first_name && c.last_name && c.birth_date && c.gender);

  const stepBlurb =
    step === 1
      ? 'Pick how you will sign in: email or mobile. That one is required; you may add the other as optional.'
      : step === 2
        ? 'We use guardian details on official school records.'
        : 'Add each child you want linked to this parent/guardian account. School staff will handle official enrollment placement.';

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/95">
      <Head title="Parent registration" />

      <main className="flex flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mx-auto w-full max-w-2xl flex-1 space-y-8 pb-12">
          <div className="space-y-1 text-center sm:text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--theme-primary)]/80">
                Parent / guardian
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.75rem]">
                Create your TALAIS account
              </h1>
              <p className="text-sm text-slate-500 max-w-xl lg:max-w-none">
                Three short steps: account, guardian, then learners.
              </p>
            </div>

            <Card className="border border-slate-200/80 shadow-xl shadow-slate-900/5">
              <CardContent className="space-y-6 p-6 sm:p-8">
                <RegistrationStepper step={step} />

                <p className="text-center text-sm text-slate-600 leading-relaxed lg:text-left">
                  {stepBlurb}
                </p>

                <Separator />

                <form onSubmit={submit} className="space-y-6">
                  {step === 1 && (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Choose what you will use to sign in. Only that field is required; the other is optional. Mobile
                        numbers are normalized (09&hellip; or +63&hellip;) for login.
                      </p>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-800">
                          I will sign in with<span className="text-red-600"> *</span>
                        </Label>
                        <RadioGroup
                          value={data.login_method}
                          onValueChange={(v) => setData('login_method', v)}
                          className="grid gap-3 sm:grid-cols-2"
                        >
                          <label
                            htmlFor="login-email"
                            className={cn(
                              'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                              data.login_method === 'email'
                                ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/[0.06]'
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
                                ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/[0.06]'
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
                        {errors.login_method && (
                          <p className="text-xs text-red-600">{errors.login_method}</p>
                        )}
                      </div>

                      {data.login_method === 'email' && (
                        <div className="space-y-1.5">
                          <Label htmlFor="email">
                            Email address <span className="text-red-600">*</span>
                          </Label>
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
                      )}

                      {data.login_method === 'phone' && (
                        <div className="space-y-1.5">
                          <Label htmlFor="phone_number">
                            Mobile number <span className="text-red-600">*</span>
                          </Label>
                          <Input
                            id="phone_number"
                            type="tel"
                            inputMode="tel"
                            value={data.phone_number}
                            autoComplete="tel"
                            className={inputClass}
                            onChange={(e) => setData('phone_number', e.target.value)}
                            placeholder="09XXXXXXXXX or +639XXXXXXXXX"
                          />
                          {errors.phone_number && (
                            <p className="text-xs text-red-600">{errors.phone_number}</p>
                          )}
                        </div>
                      )}

                      {data.login_method === 'email' && (
                        <div className="space-y-1.5 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 p-3">
                          <Label htmlFor="phone_optional" className="text-slate-700">
                            Mobile number <span className="font-normal text-slate-500">(optional)</span>
                          </Label>
                          <Input
                            id="phone_optional"
                            type="tel"
                            inputMode="tel"
                            value={data.phone_number}
                            autoComplete="tel"
                            className={inputClass}
                            onChange={(e) => setData('phone_number', e.target.value)}
                            placeholder="Add if you want both on file"
                          />
                          {errors.phone_number && data.login_method === 'email' && (
                            <p className="text-xs text-red-600">{errors.phone_number}</p>
                          )}
                        </div>
                      )}

                      {data.login_method === 'phone' && (
                        <div className="space-y-1.5 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 p-3">
                          <Label htmlFor="email_optional" className="text-slate-700">
                            Email <span className="font-normal text-slate-500">(optional)</span>
                          </Label>
                          <Input
                            id="email_optional"
                            type="email"
                            value={data.email}
                            autoComplete="email"
                            className={inputClass}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="Add if you want email on file"
                          />
                          {errors.email && data.login_method === 'phone' && (
                            <p className="text-xs text-red-600">{errors.email}</p>
                          )}
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={data.password}
                          autoComplete="new-password"
                          className={inputClass}
                          onChange={(e) => setData('password', e.target.value)}
                          required
                        />
                        {errors.password && (
                          <p className="text-xs text-red-600">{errors.password}</p>
                        )}
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
                          required
                        />
                      </div>
                      <Button
                        type="button"
                        className="h-11 w-full bg-[var(--theme-primary)] text-base font-semibold shadow-md shadow-[#1e3a5f]/25 hover:bg-[var(--theme-primary-hover)]"
                        disabled={!canGoStep2}
                        onClick={() => {
                          const phone = data.phone_number?.trim();
                          if (phone && !(data.guardian.contact_number || '').trim()) {
                            updateGuardian({ contact_number: phone });
                          }
                          setStep(2);
                        }}
                      >
                        Continue
                      </Button>
>>>>>>> Stashed changes
                    </div>

<<<<<<< Updated upstream
                    <form onSubmit={submit} className="space-y-4">
=======
                  {step === 2 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5 col-span-2 sm:col-span-1">
                          <Label>First name</Label>
                          <Input
                            value={data.guardian.first_name}
                            className={inputClass}
                            onChange={(e) =>
                              updateGuardian({ first_name: e.target.value })
                            }
                            required
                          />
                          {errors['guardian.first_name'] && (
                            <p className="text-xs text-red-600">{errors['guardian.first_name']}</p>
                          )}
                        </div>
                        <div className="space-y-1.5 col-span-2 sm:col-span-1">
                          <Label>Last name</Label>
                          <Input
                            value={data.guardian.last_name}
                            className={inputClass}
                            onChange={(e) =>
                              updateGuardian({ last_name: e.target.value })
                            }
                            required
                          />
                          {errors['guardian.last_name'] && (
                            <p className="text-xs text-red-600">{errors['guardian.last_name']}</p>
                          )}
                        </div>
                        <div className="space-y-1.5 col-span-2">
                          <Label>Middle name (optional)</Label>
                          <Input
                            value={data.guardian.middle_name ?? ''}
                            className={inputClass}
                            onChange={(e) =>
                              updateGuardian({ middle_name: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-1.5 col-span-2">
                          <Label>Relationship</Label>
                          <Select
                            value={data.guardian.relationship || undefined}
                            onValueChange={(v) => updateGuardian({ relationship: v })}
                          >
                            <SelectTrigger className={selectTriggerClass}>
                              <SelectValue placeholder="Choose one" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Mother">Mother</SelectItem>
                              <SelectItem value="Father">Father</SelectItem>
                              <SelectItem value="Legal Guardian">Legal guardian</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors['guardian.relationship'] && (
                            <p className="text-xs text-red-600">{errors['guardian.relationship']}</p>
                          )}
                        </div>
                        <div className="space-y-1.5 col-span-2 sm:col-span-1">
                          <Label>Contact number</Label>
                          <Input
                            value={data.guardian.contact_number ?? ''}
                            className={inputClass}
                            onChange={(e) =>
                              updateGuardian({ contact_number: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-1.5 col-span-2 sm:col-span-1">
                          <Label>Alternative email (optional)</Label>
                          <Input
                            type="email"
                            value={data.guardian.email ?? ''}
                            className={inputClass}
                            onChange={(e) => updateGuardian({ email: e.target.value })}
                          />
                        </div>
                        <div className="col-span-2 pt-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--theme-primary)]/90">
                            Demographics
                          </p>
                        </div>
>>>>>>> Stashed changes
                        <div className="space-y-1.5">
                            <Label htmlFor="name">Full name</Label>
                            <Input
                                id="name"
                                value={data.name}
                                autoFocus
                                onChange={(e) => setData('name', e.target.value)}
                                required
                            />
                            {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
                        </div>

                        <div className="space-y-1.5">
<<<<<<< Updated upstream
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                autoComplete="username"
                                onChange={(e) => setData('email', e.target.value)}
                                required
                            />
                            {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
=======
                          <Label>IP / ethnicity (optional)</Label>
                          <Input
                            value={data.guardian.ip_ethnic_group ?? ''}
                            className={inputClass}
                            onChange={(e) => updateGuardian({ ip_ethnic_group: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1.5 col-span-2">
                          <Label>Religion</Label>
                          <Input
                            value={data.guardian.religion ?? ''}
                            className={inputClass}
                            onChange={(e) => updateGuardian({ religion: e.target.value })}
                          />
                        </div>
                        <div className="col-span-2 pt-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--theme-primary)]/90">
                            Current address
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Same fields as for each learner below. Used on DepEd-aligned records.
                          </p>
                        </div>
                        <div className="space-y-1.5 col-span-2">
                          <Label>House no. / street / sitio</Label>
                          <Input
                            value={data.guardian.house_street_sitio ?? ''}
                            className={inputClass}
                            onChange={(e) =>
                              updateGuardian({ house_street_sitio: e.target.value })
                            }
                          />
>>>>>>> Stashed changes
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={data.password}
                                autoComplete="new-password"
                                onChange={(e) => setData('password', e.target.value)}
                                required
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
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-[#1e3a5f] hover:bg-[#2c5282]"
                        >
                            {processing ? 'Creating account…' : 'Create Account'}
                        </Button>
<<<<<<< Updated upstream

                        <p className="text-center text-sm text-slate-600">
                            Already have an account?{' '}
                            <Link href="/login" className="text-[#1e3a5f] hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </form>
                </CardContent>
=======
                        <Button
                          type="button"
                          className="h-11 flex-1 bg-[var(--theme-primary)] font-semibold shadow-md shadow-[#1e3a5f]/25 hover:bg-[var(--theme-primary-hover)]"
                          disabled={
                            !data.guardian.first_name ||
                            !data.guardian.last_name ||
                            !data.guardian.relationship
                          }
                          onClick={() => {
                            setLearnerTab('0');
                            setStep(3);
                          }}
                        >
                          Continue to learners
                        </Button>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-4">
                      <Tabs value={learnerTab} onValueChange={setLearnerTab} className="w-full">
                        <TooltipProvider delayDuration={400}>
                          <div className="mb-1 flex items-stretch gap-2 sm:items-center">
                            <TabsList className="flex h-auto min-h-10 min-w-0 flex-1 flex-nowrap justify-start gap-1 overflow-x-auto rounded-xl border border-slate-200/80 bg-slate-50 p-1.5">
                              {data.children.map((child, index) => {
                                const tabName = [child.first_name, child.last_name]
                                  .filter(Boolean)
                                  .join(' ')
                                  .trim();
                                return (
                                  <TabsTrigger
                                    key={index}
                                    value={String(index)}
                                    className="shrink-0 min-w-[6.5rem] max-w-[12rem] truncate rounded-lg px-3 py-2 text-xs font-semibold sm:min-w-[7.5rem] sm:text-sm data-[state=active]:bg-[var(--theme-primary)] data-[state=active]:text-white data-[state=active]:shadow-md"
                                  >
                                    {tabName || `Learner ${index + 1}`}
                                  </TabsTrigger>
                                );
                              })}
                            </TabsList>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-10 w-10 shrink-0 self-center rounded-xl border-dashed border-slate-300 text-[var(--theme-primary)] hover:border-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/5"
                                  onClick={addChild}
                                  aria-label="Add another learner"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" align="end">
                                Add another learner
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>

                        {data.children.map((child, index) => (
                          <TabsContent
                            key={index}
                            value={String(index)}
                            className="mt-4 space-y-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                          >
                            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                              <div>
                                <p className="text-sm font-bold text-[var(--theme-primary)]">Learner {index + 1}</p>
                                <p className="text-xs text-slate-500">Demographics and address for this learner.</p>
                              </div>
                              {data.children.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeChild(index)}
                                  className="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label>First name</Label>
                                <Input
                                  value={child.first_name}
                                  className={inputClass}
                                  onChange={(e) =>
                                    updateChild(index, { first_name: e.target.value })
                                  }
                                  required
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label>Last name</Label>
                                <Input
                                  value={child.last_name}
                                  className={inputClass}
                                  onChange={(e) =>
                                    updateChild(index, { last_name: e.target.value })
                                  }
                                  required
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label>Middle name</Label>
                                <Input
                                  value={child.middle_name ?? ''}
                                  className={inputClass}
                                  onChange={(e) =>
                                    updateChild(index, { middle_name: e.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label>Suffix</Label>
                                <Input
                                  value={child.suffix ?? ''}
                                  className={inputClass}
                                  onChange={(e) =>
                                    updateChild(index, { suffix: e.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label>Birth date</Label>
                                <Input
                                  type="date"
                                  value={child.birth_date}
                                  className={inputClass}
                                  onChange={(e) =>
                                    updateChild(index, { birth_date: e.target.value })
                                  }
                                  required
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label>Gender</Label>
                                <Select
                                  value={child.gender || undefined}
                                  onValueChange={(v) => updateChild(index, { gender: v })}
                                >
                                  <SelectTrigger className={selectTriggerClass}>
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Female">Female</SelectItem>
                                    <SelectItem value="Male">Male</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5 col-span-2">
                                <Label>LRN (12 digits – optional)</Label>
                                <Input
                                  value={child.lrn ?? ''}
                                  className={inputClass}
                                  maxLength={12}
                                  onChange={(e) =>
                                    updateChild(index, {
                                      lrn: e.target.value.replace(/\D/g, '').slice(0, 12),
                                    })
                                  }
                                />
                              </div>
                              <div className="space-y-1.5 col-span-2">
                                <Label>Birthplace</Label>
                                <Input
                                  value={child.birth_place ?? ''}
                                  className={inputClass}
                                  onChange={(e) =>
                                    updateChild(index, { birth_place: e.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label>Mother tongue</Label>
                                <Input
                                  value={child.mother_tongue ?? ''}
                                  className={inputClass}
                                  onChange={(e) =>
                                    updateChild(index, { mother_tongue: e.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label>IP / ethnicity (optional)</Label>
                                <Input
                                  value={child.ip_ethnic_group ?? ''}
                                  className={inputClass}
                                  onChange={(e) =>
                                    updateChild(index, {
                                      ip_ethnic_group: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label>Religion</Label>
                                <Input
                                  value={child.religion ?? ''}
                                  className={inputClass}
                                  onChange={(e) =>
                                    updateChild(index, { religion: e.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-1.5 col-span-2 rounded-lg border border-slate-100 bg-slate-50/80 p-3">
                                <div className="flex items-start gap-3">
                                  <Checkbox
                                    id={`same-addr-${index}`}
                                    checked={!!child.same_address_as_guardian}
                                    onCheckedChange={(checked) => {
                                      if (checked === true) {
                                        updateChild(index, {
                                          same_address_as_guardian: true,
                                          house_street_sitio: data.guardian.house_street_sitio ?? '',
                                          barangay: data.guardian.barangay ?? '',
                                          municipality_city: data.guardian.municipality_city ?? '',
                                          province: data.guardian.province ?? '',
                                        });
                                      } else {
                                        updateChild(index, { same_address_as_guardian: false });
                                      }
                                    }}
                                    className="mt-0.5 border-slate-300 data-[state=checked]:border-[var(--theme-primary)] data-[state=checked]:bg-[var(--theme-primary)]"
                                  />
                                  <div>
                                    <Label
                                      htmlFor={`same-addr-${index}`}
                                      className="cursor-pointer text-sm font-medium text-slate-800"
                                    >
                                      Same address as parent/guardian
                                    </Label>
                                    {child.same_address_as_guardian ? (
                                      <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                                        Copied from Step 2. Editing guardian address updates learners with this
                                        turned on.
                                      </p>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-1.5 col-span-2">
                                <Label>House no. / street / sitio</Label>
                                <Input
                                  value={child.house_street_sitio ?? ''}
                                  className={cn(
                                    inputClass,
                                    child.same_address_as_guardian && 'bg-slate-50 text-slate-700',
                                  )}
                                  disabled={!!child.same_address_as_guardian}
                                  onChange={(e) =>
                                    updateChild(index, {
                                      house_street_sitio: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label>Barangay</Label>
                                <Input
                                  value={child.barangay ?? ''}
                                  className={cn(
                                    inputClass,
                                    child.same_address_as_guardian && 'bg-slate-50 text-slate-700',
                                  )}
                                  disabled={!!child.same_address_as_guardian}
                                  onChange={(e) =>
                                    updateChild(index, { barangay: e.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label>Municipality / city</Label>
                                <Input
                                  value={child.municipality_city ?? ''}
                                  className={cn(
                                    inputClass,
                                    child.same_address_as_guardian && 'bg-slate-50 text-slate-700',
                                  )}
                                  disabled={!!child.same_address_as_guardian}
                                  onChange={(e) =>
                                    updateChild(index, {
                                      municipality_city: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className="space-y-1.5 col-span-2">
                                <Label>Province</Label>
                                <Input
                                  value={child.province ?? ''}
                                  className={cn(
                                    inputClass,
                                    child.same_address_as_guardian && 'bg-slate-50 text-slate-700',
                                  )}
                                  disabled={!!child.same_address_as_guardian}
                                  onChange={(e) =>
                                    updateChild(index, { province: e.target.value })
                                  }
                                />
                              </div>
                            </div>
                            {[
                              `children.${index}.first_name`,
                              `children.${index}.last_name`,
                              `children.${index}.birth_date`,
                              `children.${index}.gender`,
                              `children.${index}.lrn`,
                            ].map((k) =>
                              errors[k] ? (
                                <p key={k} className="text-xs text-red-600">
                                  {errors[k]}
                                </p>
                              ) : null,
                            )}
                          </TabsContent>
                        ))}
                      </Tabs>

                      {errors.children && (
                        <p className="text-xs text-red-600">{errors.children}</p>
                      )}

                      {validationErrorsSummary && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                          {validationErrorsSummary.map((m, i) => (
                            <p key={i}>{m}</p>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setStep(2)}
                          className="h-11 flex-1"
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Button
                          type="submit"
                          disabled={processing || !canGoStep3}
                          className="h-11 flex-1 bg-[var(--theme-primary)] font-semibold shadow-md shadow-[#1e3a5f]/25 hover:bg-[var(--theme-primary-hover)]"
                        >
                          {processing ? 'Submitting…' : 'Submit & finish'}
                        </Button>
                      </div>
                    </div>
                  )}
                </form>

                <Separator />

                <p className="text-center text-sm text-slate-600">
                  Already registered?{' '}
                  <Link
                    href="/login"
                    className="font-semibold text-[var(--theme-primary)] hover:text-[var(--theme-primary-hover)] hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </CardContent>
>>>>>>> Stashed changes
            </Card>
        </div>
    );
}
