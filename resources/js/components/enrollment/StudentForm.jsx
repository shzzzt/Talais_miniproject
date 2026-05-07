import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/lib/api";
import { extractApiError } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Search } from "lucide-react";

function mapStudentApiToForm(s) {
  if (!s) return null;
  return {
    lrn: s.lrn != null ? String(s.lrn) : "",
    first_name: s.first_name ?? "",
    middle_name: s.middle_name ?? "",
    last_name: s.last_name ?? "",
    suffix: s.suffix ?? "",
    birthday: s.birthday ?? s.birth_date ?? "",
    gender: s.gender ?? "",
    address: s.address ?? "",
    contact_number: s.contact_number ?? "",
    parent_name: s.parent_name ?? "",
    parent_contact: s.parent_contact ?? "",
    parent_relationship: s.parent_relationship ?? "",
    parent_occupation: s.parent_occupation ?? "",
    current_grade_level: s.current_grade_level ?? "",
    current_section_id:
      s.current_section_id != null && s.current_section_id !== ""
        ? String(s.current_section_id)
        : "",
    status: s.status ?? "enrolled",
    remarks: s.remarks ?? "",
  };
}

const emptyForm = () => ({
  lrn: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  suffix: "",
  birthday: "",
  gender: "",
  address: "",
  contact_number: "",
  parent_name: "",
  parent_contact: "",
  parent_relationship: "",
  parent_occupation: "",
  current_grade_level: "",
  current_section_id: "",
  status: "enrolled",
  remarks: "",
});

export default function StudentForm({ open, onClose, onSubmit, student, sections }) {
  const [kind, setKind] = useState("new"); // new | continuing
  const [form, setForm] = useState(emptyForm());
  const [lookupLoading, setLookupLoading] = useState(false);

  const { data: gradeLevels = [] } = useQuery({
    queryKey: ["gradeLevels"],
    queryFn: () => base44.entities.GradeLevel.list(),
    enabled: open,
  });

  const gradeNames = useMemo(() => gradeLevels.map((g) => g.name).filter(Boolean), [gradeLevels]);

  useEffect(() => {
    if (!open) return;
    if (student?.id) {
      setKind("new");
      setForm({
        ...emptyForm(),
        ...mapStudentApiToForm(student),
      });
    } else {
      setKind("new");
      setForm(emptyForm());
    }
  }, [student, open]);

  const handleSubmit = () => {
    const section = sections.find(
      (sec) => String(sec.id) === String(form.current_section_id)
    );
    const sid =
      form.current_section_id === "" || form.current_section_id == null
        ? null
        : Number(form.current_section_id);

    const payload = {
      ...form,
      current_section_id: sid,
      current_section_name: section?.name || "",
      enrollment_type: student?.id ? undefined : kind === "continuing" ? "continuing" : "new",
    };
    delete payload.remarks;

    if (student?.id) {
      delete payload.enrollment_type;
    }

    onSubmit(payload);
  };

  const filteredSections = sections.filter((s) => s.grade_level === form.current_grade_level);
  const set = (field, val) => setForm((prev) => ({ ...prev, [field]: val }));

  const lookupLrn = async () => {
    const digits = String(form.lrn || "").trim();
    if (digits.length !== 12 || !/^\d{12}$/.test(digits)) {
      alert("LRN must be exactly 12 digits.");
      return;
    }
    setLookupLoading(true);
    try {
      const data = await base44.students.lookup(digits);
      if (!data) {
        alert("No learner found with this LRN.");
        return;
      }
      const mapped = mapStudentApiToForm(data);
      setForm((prev) => ({
        ...prev,
        ...mapped,
        lrn: digits,
      }));
    } catch (e) {
      if (e?.response?.status === 404) {
        alert("No learner found with this LRN.");
      } else {
        alert(extractApiError(e));
      }
    } finally {
      setLookupLoading(false);
    }
  };

  const gradesForSelect =
    gradeNames.length > 0
      ? gradeNames
      : [
          "Grade 1",
          "Grade 2",
          "Grade 3",
          "Grade 4",
          "Grade 5",
          "Grade 6",
          "Grade 7",
          "Grade 8",
          "Grade 9",
          "Grade 10",
        ];

  const canSubmit =
    form.first_name &&
    form.last_name &&
    form.lrn &&
    String(form.lrn).trim().length === 12 &&
    form.gender &&
    form.current_grade_level;

  const showKindToggle = !student?.id;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{student ? "Edit Student" : "Student enrollment"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {showKindToggle && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Registration type
              </Label>
              <RadioGroup
                value={kind}
                onValueChange={setKind}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="new" id="sk_new" />
                  <Label htmlFor="sk_new">New learner</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="continuing" id="sk_cont" />
                  <Label htmlFor="sk_cont">Continuing (LRN lookup)</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {kind === "continuing" && !student?.id && (
            <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3 space-y-2">
              <p className="text-xs text-blue-900">
                Enter the learner&apos;s registered LRN, then retrieve profile data before assigning
                the current grade and section.
              </p>
              <div className="flex gap-2">
                <Input
                  value={form.lrn}
                  onChange={(e) => set("lrn", e.target.value.replace(/\D/g, "").slice(0, 12))}
                  placeholder="12-digit LRN"
                  className="font-mono"
                />
                <Button type="button" variant="outline" disabled={lookupLoading} onClick={lookupLrn}>
                  {lookupLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 mr-1" />
                  )}
                  Lookup
                </Button>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Student Information
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {(kind !== "continuing" || student?.id) && (
                <div className="col-span-2">
                  <Label>LRN (Learner Reference Number)</Label>
                  <Input
                    value={form.lrn}
                    onChange={(e) => set("lrn", e.target.value.replace(/\D/g, "").slice(0, 12))}
                    placeholder="12-digit LRN"
                    className="font-mono"
                    disabled={!!student?.id}
                  />
                </div>
              )}
              <div>
                <Label>First Name *</Label>
                <Input value={form.first_name} onChange={(e) => set("first_name", e.target.value)} />
              </div>
              <div>
                <Label>Middle Name</Label>
                <Input value={form.middle_name} onChange={(e) => set("middle_name", e.target.value)} />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} />
              </div>
              <div>
                <Label>Suffix</Label>
                <Input
                  value={form.suffix}
                  onChange={(e) => set("suffix", e.target.value)}
                  placeholder="Jr., III"
                />
              </div>
              <div>
                <Label>Birthday</Label>
                <Input type="date" value={form.birthday} onChange={(e) => set("birthday", e.target.value)} />
              </div>
              <div>
                <Label>Gender *</Label>
                <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
              </div>
              <div>
                <Label>Contact Number</Label>
                <Input
                  value={form.contact_number}
                  onChange={(e) => set("contact_number", e.target.value)}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enrolled">Enrolled</SelectItem>
                    <SelectItem value="transferred_in">Transferred In</SelectItem>
                    <SelectItem value="transferred_out">Transferred Out</SelectItem>
                    <SelectItem value="dropped">Dropped</SelectItem>
                    <SelectItem value="graduated">Graduated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Grade & Section
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Grade Level *</Label>
                <Select value={form.current_grade_level} onValueChange={(v) => set("current_grade_level", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradesForSelect.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Section</Label>
                <Select
                  value={form.current_section_id}
                  onValueChange={(v) => set("current_section_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSections.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Parent / Guardian
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Full Name</Label>
                <Input value={form.parent_name} onChange={(e) => set("parent_name", e.target.value)} />
              </div>
              <div>
                <Label>Contact Number</Label>
                <Input
                  value={form.parent_contact}
                  onChange={(e) => set("parent_contact", e.target.value)}
                />
              </div>
              <div>
                <Label>Relationship</Label>
                <Select value={form.parent_relationship} onValueChange={(v) => set("parent_relationship", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mother">Mother</SelectItem>
                    <SelectItem value="Father">Father</SelectItem>
                    <SelectItem value="Legal Guardian">Legal Guardian</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Occupation</Label>
                <Input
                  value={form.parent_occupation}
                  onChange={(e) => set("parent_occupation", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <Label>Remarks</Label>
            <Textarea value={form.remarks} onChange={(e) => set("remarks", e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onClose?.()}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="bg-[#1e3a5f] hover:bg-[#2c5282]"
          >
            {student ? "Update" : "Save student"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
