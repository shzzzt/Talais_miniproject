import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '../components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/lib/api';
import { base44 } from '@/lib/api';
import { extractApiError } from '@/lib/utils';
import { ArrowLeft, Check } from 'lucide-react';
import { Link, usePage } from '@inertiajs/react';
import React from 'react';

const inputClass = 'h-11 bg-white';
const selectTriggerClass = 'h-11 bg-white';

export default function ParentEnrollStudent() {
  const qc = useQueryClient();
  const { props } = usePage();
  const [form, setForm] = React.useState({
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
    grade_level_id: '',
  });
  const [sameAddressAsParent, setSameAddressAsParent] = React.useState(false);

  const { data: gradeLevels = [] } = useQuery({
    queryKey: ['gradeLevels'],
    queryFn: () => base44.entities.GradeLevel.list(),
  });

  const newStudentMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await http.post('/parent/register-student', payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: async () => {
      toast.success('Student registered successfully!');
      qc.invalidateQueries({ queryKey: ['parent-onboarding-summary'] });
      setForm({
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
        grade_level_id: '',
      });
      setTimeout(() => {
        window.location.href = '/ParentEnrollment';
      }, 1500);
    },
    onError: (e) => toast.error(extractApiError(e)),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.birth_date || !form.gender || !form.grade_level_id) {
      toast.error('Please fill in all required fields');
      return;
    }
    newStudentMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/ParentEnrollment">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <PageHeader
          title="Enroll a New Student"
          description="Enter the complete information for the new student you want to register."
        />
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Personal Information</h3>
              <Separator />
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first_name">
                    First Name <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="first_name"
                    className={inputClass}
                    placeholder="First name"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="middle_name">Middle Name</Label>
                  <Input
                    id="middle_name"
                    className={inputClass}
                    placeholder="Middle name"
                    value={form.middle_name}
                    onChange={(e) => setForm({ ...form, middle_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">
                    Last Name <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="last_name"
                    className={inputClass}
                    placeholder="Last name"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="suffix">Suffix</Label>
                  <Input
                    id="suffix"
                    className={inputClass}
                    placeholder="Jr., Sr., III, etc."
                    value={form.suffix}
                    onChange={(e) => setForm({ ...form, suffix: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birth_date">
                    Date of Birth <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="birth_date"
                    type="date"
                    className={inputClass}
                    value={form.birth_date}
                    onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">
                    Gender <span className="text-red-600">*</span>
                  </Label>
                  <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Grade Level */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">School Information</h3>
              <Separator />

              <div className="space-y-2">
                <Label htmlFor="grade_level_id">
                  Grade Level <span className="text-red-600">*</span>
                </Label>
                <Select value={form.grade_level_id} onValueChange={(v) => setForm({ ...form, grade_level_id: v })}>
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Select grade level" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeLevels.map((gl) => (
                      <SelectItem key={gl.id} value={String(gl.id)}>
                        {gl.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Identification & Birth */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Identification & Birth</h3>
              <Separator />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lrn">LRN (Learner Reference Number)</Label>
                  <Input
                    id="lrn"
                    className={inputClass}
                    placeholder="LRN"
                    value={form.lrn}
                    onChange={(e) => setForm({ ...form, lrn: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birth_place">Birth Place</Label>
                  <Input
                    id="birth_place"
                    className={inputClass}
                    placeholder="City/Municipality, Province"
                    value={form.birth_place}
                    onChange={(e) => setForm({ ...form, birth_place: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Cultural & Religious Background */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Cultural & Religious Background</h3>
              <Separator />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="mother_tongue">Mother Tongue</Label>
                  <Input
                    id="mother_tongue"
                    className={inputClass}
                    placeholder="e.g., Tagalog, English, Ilocano"
                    value={form.mother_tongue}
                    onChange={(e) => setForm({ ...form, mother_tongue: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ip_ethnic_group">IP/Ethnic Group</Label>
                  <Input
                    id="ip_ethnic_group"
                    className={inputClass}
                    placeholder="If applicable"
                    value={form.ip_ethnic_group}
                    onChange={(e) => setForm({ ...form, ip_ethnic_group: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="religion">Religion</Label>
                  <Input
                    id="religion"
                    className={inputClass}
                    placeholder="e.g., Roman Catholic, Protestant"
                    value={form.religion}
                    onChange={(e) => setForm({ ...form, religion: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Address Information</h3>
              <Separator />

              <div className="flex items-center gap-2">
                <Checkbox
                  id="same_address_as_parent"
                  checked={sameAddressAsParent}
                  onCheckedChange={(checked) => {
                    setSameAddressAsParent(checked);
                    if (checked && props?.guardian) {
                      setForm((f) => ({
                        ...f,
                        house_street_sitio: props.guardian.house_street_sitio || '',
                        barangay: props.guardian.barangay || '',
                        municipality_city: props.guardian.municipality_city || '',
                        province: props.guardian.province || '',
                      }));
                    }
                  }}
                />
                <Label htmlFor="same_address_as_parent" className="cursor-pointer font-normal">
                  Same address as parent
                </Label>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="house_street_sitio">House/Street/Sitio</Label>
                  <Input
                    id="house_street_sitio"
                    className={inputClass}
                    placeholder="Complete street address"
                    value={form.house_street_sitio}
                    onChange={(e) => setForm({ ...form, house_street_sitio: e.target.value })}
                    disabled={sameAddressAsParent}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="barangay">Barangay</Label>
                    <Input
                      id="barangay"
                      className={inputClass}
                      placeholder="Barangay"
                      value={form.barangay}
                      onChange={(e) => setForm({ ...form, barangay: e.target.value })}
                      disabled={sameAddressAsParent}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="municipality_city">Municipality/City</Label>
                    <Input
                      id="municipality_city"
                      className={inputClass}
                      placeholder="Municipality/City"
                      value={form.municipality_city}
                      onChange={(e) => setForm({ ...form, municipality_city: e.target.value })}
                      disabled={sameAddressAsParent}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="province">Province</Label>
                  <Input
                    id="province"
                    className={inputClass}
                    placeholder="Province"
                    value={form.province}
                    onChange={(e) => setForm({ ...form, province: e.target.value })}
                    disabled={sameAddressAsParent}
                  />
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Documents</h3>
              <Separator />

              <div className="space-y-2">
                <Label htmlFor="birth_certificate">Add Birth Certificate</Label>
                <Input
                  id="birth_certificate"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="h-11 bg-white"
                />
                <p className="text-xs text-slate-500">Accepted formats: PDF, JPG, JPEG, PNG (Max size: 5MB)</p>
              </div>
            </div>

            <Separator />

            {/* Form Actions */}
            <div className="flex gap-3">
              <Link href="/ParentEnrollment" className="flex-1">
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={newStudentMutation.isPending}
                className="flex-1 bg-[#1e3a5f] hover:bg-[#2c5282]"              >
                {newStudentMutation.isPending ? 'Registering…' : 'Register Student'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

ParentEnrollStudent.layout = (page) => (
  <AppLayout currentPageName="ParentEnrollStudent">{page}</AppLayout>
);
