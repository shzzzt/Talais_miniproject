<?php

namespace App\Http\Controllers\Api;

use App\Exports\HeadingRowsExport;
use App\Exports\PirMultiSheetExport;
use App\Http\Controllers\Concerns\ReportsSchoolContext;
use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentGrade;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * DepEd-style reports as Excel — mirrors {@see ReportController} PDF routes (Wave 5).
 */
class ReportExcelController extends Controller
{
    use ReportsSchoolContext;

    public function sf1(Request $request): BinaryFileResponse
    {
        $section = $this->resolveSection($request);
        $schoolYear = $this->resolveSchoolYear($request, $section);

        $enrollments = Enrollment::query()
            ->with(['student', 'gradeLevel', 'section'])
            ->when($section, fn ($q) => $q->where('section_id', $section->id))
            ->when($schoolYear, fn ($q) => $q->where('school_year_id', $schoolYear->id))
            ->where('status', 'enrolled')
            ->get()
            ->sortBy(fn ($e) => $e->student->last_name.' '.$e->student->first_name)
            ->values();

        $headings = ['#', 'LRN', 'Last Name', 'First Name', 'Middle Name', 'Sex', 'Birth Date', 'Age', 'Mother Tongue', 'IP/Ethnic Group'];
        $rows = [];
        foreach ($enrollments as $i => $enrollment) {
            $student = $enrollment->student;
            $rows[] = [
                $i + 1,
                $student->lrn,
                $student->last_name,
                $student->first_name,
                $student->middle_name,
                strtoupper(substr((string) ($student->gender ?? ''), 0, 1)),
                $student->birth_date?->format('Y-m-d'),
                $student->age,
                $student->mother_tongue,
                $student->ip_ethnic_group,
            ];
        }

        return Excel::download(
            new HeadingRowsExport($headings, $rows, 'SF1'),
            $this->excelBasename('SF1', $section, $schoolYear),
        );
    }

    public function sf2(Request $request): BinaryFileResponse
    {
        $request->validate([
            'section_id' => 'required|integer|exists:sections,id',
            'from' => 'sometimes|date',
            'to' => 'sometimes|date',
        ]);

        $section = Section::with(['gradeLevel', 'adviser'])->findOrFail($request->integer('section_id'));
        $schoolYear = $this->resolveSchoolYear($request, $section);
        $from = $request->filled('from') ? Carbon::parse($request->input('from')) : now()->startOfMonth();
        $to = $request->filled('to') ? Carbon::parse($request->input('to')) : now()->endOfMonth();

        $enrollments = Enrollment::query()
            ->with('student')
            ->where('section_id', $section->id)
            ->when($schoolYear, fn ($q) => $q->where('school_year_id', $schoolYear->id))
            ->get();

        $rows = [];
        foreach ($enrollments as $e) {
            $stats = AttendanceRecord::query()
                ->where('enrollment_id', $e->id)
                ->whereDate('date', '>=', $from)
                ->whereDate('date', '<=', $to)
                ->get();

            $rows[] = [
                $e->student->lrn,
                $e->student->last_name.', '.$e->student->first_name,
                $stats->whereIn('am_status', ['present'])->count() + $stats->whereIn('pm_status', ['present'])->count(),
                $stats->whereIn('am_status', ['absent'])->count() + $stats->whereIn('pm_status', ['absent'])->count(),
                $stats->whereIn('am_status', ['late'])->count() + $stats->whereIn('pm_status', ['late'])->count(),
                $stats->whereIn('am_status', ['excused'])->count() + $stats->whereIn('pm_status', ['excused'])->count(),
            ];
        }
        usort($rows, fn ($a, $b) => strcmp($a[1], $b[1]));

        return Excel::download(
            new HeadingRowsExport(['LRN', 'Name', 'Present (sessions)', 'Absent (sessions)', 'Late', 'Excused'], $rows, 'SF2'),
            $this->excelBasename('SF2_'.$from->format('Ymd').'_'.$to->format('Ymd'), $section, $schoolYear),
        );
    }

    public function sf4(Request $request): BinaryFileResponse
    {
        $schoolYear = $this->resolveSchoolYear($request, null);
        $month = $request->input('month', now()->format('F Y'));

        $gradeLevels = GradeLevel::orderBy('id')->get();
        $headings = ['Grade Level', 'Male', 'Female', 'Total', 'Transfer In', 'Transfer Out', 'Dropouts', 'Reporting Month'];

        $rows = [];
        foreach ($gradeLevels as $gl) {
            $base = Enrollment::query()
                ->where('grade_level_id', $gl->id)
                ->when($schoolYear, fn ($q) => $q->where('school_year_id', $schoolYear->id));

            $male = (clone $base)->where('status', 'enrolled')
                ->whereHas('student', fn ($s) => $s->where('gender', 'Male'))
                ->count();
            $female = (clone $base)->where('status', 'enrolled')
                ->whereHas('student', fn ($s) => $s->where('gender', 'Female'))
                ->count();

            $rows[] = [
                $gl->name,
                $male,
                $female,
                $male + $female,
                (clone $base)->where('enrollment_type', 'transfer_in')->count(),
                (clone $base)->whereIn('status', ['transferred_out', 'transferred'])->count(),
                (clone $base)->where('status', 'dropped')->count(),
                $month,
            ];
        }

        return Excel::download(new HeadingRowsExport($headings, $rows, 'SF4'), $this->excelBasename('SF4', null, $schoolYear));
    }

    public function sf5(Request $request): BinaryFileResponse
    {
        $section = $this->resolveSection($request);
        $schoolYear = $this->resolveSchoolYear($request, $section);

        $enrollments = Enrollment::query()
            ->with('student')
            ->when($section, fn ($q) => $q->where('section_id', $section->id))
            ->when($schoolYear, fn ($q) => $q->where('school_year_id', $schoolYear->id))
            ->get();

        $headings = ['LRN', 'Name', 'General Average', 'Remarks'];

        $rows = [];
        foreach ($enrollments as $e) {
            $finals = StudentGrade::where('enrollment_id', $e->id)->whereNotNull('final_grade')->pluck('final_grade');
            $avg = $finals->count() > 0 ? round((float) $finals->avg(), 2) : null;
            $rows[] = [
                $e->student->lrn,
                $e->student->last_name.', '.$e->student->first_name,
                $avg,
                $e->status,
            ];
        }

        usort($rows, fn ($a, $b) => strcmp($a[1], $b[1]));

        return Excel::download(
            new HeadingRowsExport($headings, $rows, 'SF5'),
            $this->excelBasename('SF5', $section, $schoolYear),
        );
    }

    public function form137(Request $request): BinaryFileResponse
    {
        $request->validate(['student_id' => 'required|integer|exists:students,id']);
        $student = Student::findOrFail($request->integer('student_id'));

        $enrollments = Enrollment::query()
            ->with(['gradeLevel', 'section', 'schoolYear'])
            ->where('student_id', $student->id)
            ->orderBy('school_year_id')
            ->get();

        $headings = [
            'School Year', 'Grade Level', 'Section',
            'Subject', 'Q1', 'Q2', 'Q3', 'Q4', 'Final', 'Remarks',
        ];
        $rows = [];

        foreach ($enrollments as $enrollment) {
            $grades = StudentGrade::with(['subject', 'quarter'])
                ->where('enrollment_id', $enrollment->id)
                ->get();

            $grouped = [];
            foreach ($grades as $g) {
                $name = $g->subject?->name ?? 'Subject';
                $grouped[$name] ??= ['subject' => $name, 'Q1' => null, 'Q2' => null, 'Q3' => null, 'Q4' => null, 'final' => null, 'remarks' => null];
                $key = 'Q'.$g->quarter?->quarter_number;
                if (in_array($key, ['Q1', 'Q2', 'Q3', 'Q4'], true)) {
                    $grouped[$name][$key] = $g->quarterly_grade;
                }
                if ($g->final_grade !== null) {
                    $grouped[$name]['final'] = (float) $g->final_grade;
                    $grouped[$name]['remarks'] = $g->final_grade >= 75 ? 'Passed' : 'Failed';
                }
            }

            foreach (array_values($grouped) as $row) {
                $rows[] = [
                    $enrollment->schoolYear?->label,
                    $enrollment->gradeLevel?->name,
                    $enrollment->section?->name,
                    $row['subject'],
                    $row['Q1'],
                    $row['Q2'],
                    $row['Q3'],
                    $row['Q4'],
                    $row['final'],
                    $row['remarks'],
                ];
            }
        }

        return Excel::download(
            new HeadingRowsExport($headings, $rows, 'Form137'),
            $this->excelBasename('Form137_'.$student->last_name, null, null),
        );
    }

    public function form138(Request $request): BinaryFileResponse
    {
        $request->validate([
            'student_id' => 'required|integer|exists:students,id',
            'school_year_id' => 'sometimes|integer|exists:school_years,id',
        ]);
        $student = Student::findOrFail($request->integer('student_id'));

        $enrollment = Enrollment::query()
            ->with(['gradeLevel', 'section.adviser', 'schoolYear'])
            ->where('student_id', $student->id)
            ->when($request->filled('school_year_id'), fn ($q) => $q->where('school_year_id', $request->integer('school_year_id')))
            ->orderByDesc('id')
            ->firstOrFail();

        $grades = StudentGrade::with(['subject', 'quarter'])->where('enrollment_id', $enrollment->id)->get();

        $headings = ['Subject', 'Q1', 'Q2', 'Q3', 'Q4', 'Final', 'Remarks'];

        $rows = [];
        $group = [];
        foreach ($grades as $g) {
            $name = $g->subject?->name ?? 'Subject';
            $group[$name] ??= ['subject' => $name, 'Q1' => null, 'Q2' => null, 'Q3' => null, 'Q4' => null, 'final' => null, 'remarks' => null];
            $key = 'Q'.$g->quarter?->quarter_number;
            if (in_array($key, ['Q1', 'Q2', 'Q3', 'Q4'], true)) {
                $group[$name][$key] = $g->quarterly_grade;
            }
            if ($g->final_grade !== null) {
                $group[$name]['final'] = (float) $g->final_grade;
                $group[$name]['remarks'] = $g->final_grade >= 75 ? 'Passed' : 'Failed';
            }
        }

        foreach (array_values($group) as $row) {
            $rows[] = [
                $row['subject'],
                $row['Q1'],
                $row['Q2'],
                $row['Q3'],
                $row['Q4'],
                $row['final'],
                $row['remarks'],
            ];
        }

        return Excel::download(
            new HeadingRowsExport($headings, $rows, 'Form138'),
            $this->excelBasename('Form138_'.$student->last_name, null, $enrollment->schoolYear),
        );
    }

    public function pir(Request $request): BinaryFileResponse
    {
        $schoolYear = $this->resolveSchoolYear($request, null);

        return Excel::download(
            new PirMultiSheetExport($schoolYear),
            $this->excelBasename('PIR', null, $schoolYear),
        );
    }
}
