import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const GRADE_LEVELS = ["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10"];

export default function StudentForm({ open, onClose, onSubmit, student, sections }) {
  const [form, setForm] = useState({
    lrn: "", first_name: "", middle_name: "", last_name: "", suffix: "",
    birthday: "", gender: "", address: "", contact_number: "",
    parent_name: "", parent_contact: "", parent_relationship: "", parent_occupation: "",
    current_grade_level: "", current_section_id: "", status: "enrolled", remarks: ""
  });

  useEffect(() => {
    if (student) {
      setForm({ ...form, ...student });
    } else {
      setForm({
        lrn: "", first_name: "", middle_name: "", last_name: "", suffix: "",
        birthday: "", gender: "", address: "", contact_number: "",
        parent_name: "", parent_contact: "", parent_relationship: "", parent_occupation: "",
        current_grade_level: "", current_section_id: "", status: "enrolled", remarks: ""
      });
    }
  }, [student, open]);

  const handleSubmit = () => {
    const section = sections.find(s => s.id === form.current_section_id);
    onSubmit({
      ...form,
      current_section_name: section?.name || ""
    });
  };

  const filteredSections = sections.filter(s => s.grade_level === form.current_grade_level);

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{student ? "Edit Student" : "Enroll New Student"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Student Info */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Student Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>LRN (Learner Reference Number)</Label>
                <Input value={form.lrn} onChange={e => set("lrn", e.target.value)} placeholder="12-digit LRN" />
              </div>
              <div>
                <Label>First Name *</Label>
                <Input value={form.first_name} onChange={e => set("first_name", e.target.value)} />
              </div>
              <div>
                <Label>Middle Name</Label>
                <Input value={form.middle_name} onChange={e => set("middle_name", e.target.value)} />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input value={form.last_name} onChange={e => set("last_name", e.target.value)} />
              </div>
              <div>
                <Label>Suffix</Label>
                <Input value={form.suffix} onChange={e => set("suffix", e.target.value)} placeholder="Jr., III" />
              </div>
              <div>
                <Label>Birthday</Label>
                <Input type="date" value={form.birthday} onChange={e => set("birthday", e.target.value)} />
              </div>
              <div>
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={v => set("gender", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={e => set("address", e.target.value)} />
              </div>
              <div>
                <Label>Contact Number</Label>
                <Input value={form.contact_number} onChange={e => set("contact_number", e.target.value)} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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

          {/* Grade & Section */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Grade & Section</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Grade Level</Label>
                <Select value={form.current_grade_level} onValueChange={v => set("current_grade_level", v)}>
                  <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                  <SelectContent>
                    {GRADE_LEVELS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Section</Label>
                <Select value={form.current_section_id} onValueChange={v => set("current_section_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                  <SelectContent>
                    {filteredSections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Parent Info */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Parent / Guardian</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Full Name</Label>
                <Input value={form.parent_name} onChange={e => set("parent_name", e.target.value)} />
              </div>
              <div>
                <Label>Contact Number</Label>
                <Input value={form.parent_contact} onChange={e => set("parent_contact", e.target.value)} />
              </div>
              <div>
                <Label>Relationship</Label>
                <Select value={form.parent_relationship} onValueChange={v => set("parent_relationship", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mother">Mother</SelectItem>
                    <SelectItem value="Father">Father</SelectItem>
                    <SelectItem value="Guardian">Guardian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Occupation</Label>
                <Input value={form.parent_occupation} onChange={e => set("parent_occupation", e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <Label>Remarks</Label>
            <Textarea value={form.remarks} onChange={e => set("remarks", e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!form.first_name || !form.last_name || !form.lrn}
            className="bg-[#1e3a5f] hover:bg-[#2c5282]"
          >
            {student ? "Update" : "Enroll Student"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}