<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ReportsSchoolContext;
use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\ParentGuardian;
use App\Models\Quarter;
use App\Models\SchoolYear;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentGrade;
use App\Services\Sf9ReportCardService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\File;
use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;
use PhpOffice\PhpSpreadsheet\Writer\Pdf\Dompdf as SpreadsheetDompdf;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ReportController extends Controller
{
    use ReportsSchoolContext;

    public function sf1(Request $request): Response
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

        $pdf = Pdf::loadView('reports.sf1', [
            'title' => 'School Form 1 — School Register',
            'subtitle' => 'List of enrolled learners',
            'school' => $this->schoolMeta(),
            'section' => $section,
            'schoolYear' => $schoolYear,
            'enrollments' => $enrollments,
        ])->setPaper('legal', 'landscape');

        return $pdf->download($this->pdfFilename('SF1', $section, $schoolYear));
    }

    public function sf2(Request $request): Response
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

        $rows = $enrollments->map(function (Enrollment $e) use ($from, $to) {
            $stats = AttendanceRecord::query()
                ->where('enrollment_id', $e->id)
                ->whereDate('date', '>=', $from)
                ->whereDate('date', '<=', $to)
                ->get();

            return [
                'lrn' => $e->student->lrn,
                'name' => $e->student->last_name.', '.$e->student->first_name,
                'present' => $stats->whereIn('am_status', ['present'])->count() + $stats->whereIn('pm_status', ['present'])->count(),
                'absent' => $stats->whereIn('am_status', ['absent'])->count() + $stats->whereIn('pm_status', ['absent'])->count(),
                'late' => $stats->whereIn('am_status', ['late'])->count() + $stats->whereIn('pm_status', ['late'])->count(),
                'excused' => $stats->whereIn('am_status', ['excused'])->count() + $stats->whereIn('pm_status', ['excused'])->count(),
                'total' => $stats->count(),
            ];
        })->sortBy('name')->values()->toArray();

        $pdf = Pdf::loadView('reports.sf2', [
            'title' => 'School Form 2 — Daily Attendance',
            'subtitle' => 'Summary of pupils\' attendance',
            'school' => $this->schoolMeta(),
            'section' => $section,
            'schoolYear' => $schoolYear,
            'rows' => $rows,
            'from' => $from,
            'to' => $to,
        ])->setPaper('legal', 'landscape');

        return $pdf->download($this->pdfFilename('SF2', $section, $schoolYear));
    }

    public function sf4(Request $request): Response
    {
        $schoolYear = $this->resolveSchoolYear($request, null);
        $month = $request->input('month', now()->format('F Y'));

        $gradeLevels = GradeLevel::orderBy('id')->get();
        $rows = [];
        $totals = ['male' => 0, 'female' => 0, 'total' => 0, 'transfer_in' => 0, 'transfer_out' => 0, 'dropouts' => 0];

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
            $transferIn = (clone $base)->where('enrollment_type', 'transfer_in')->count();
            $transferOut = (clone $base)->whereIn('status', ['transferred_out', 'transferred'])->count();
            $dropouts = (clone $base)->where('status', 'dropped')->count();

            $rows[] = [
                'grade_level' => $gl->name,
                'male' => $male,
                'female' => $female,
                'total' => $male + $female,
                'transfer_in' => $transferIn,
                'transfer_out' => $transferOut,
                'dropouts' => $dropouts,
            ];
            $totals['male'] += $male;
            $totals['female'] += $female;
            $totals['total'] += $male + $female;
            $totals['transfer_in'] += $transferIn;
            $totals['transfer_out'] += $transferOut;
            $totals['dropouts'] += $dropouts;
        }

        $pdf = Pdf::loadView('reports.sf4', [
            'title' => 'School Form 4 — Monthly Learner\'s Movement',
            'school' => $this->schoolMeta(),
            'schoolYear' => $schoolYear,
            'month' => $month,
            'rows' => $rows,
            'totals' => $totals,
        ])->setPaper('legal', 'landscape');

        return $pdf->download($this->pdfFilename('SF4', null, $schoolYear));
    }

    public function sf5(Request $request): Response
    {
        $section = $this->resolveSection($request);
        $schoolYear = $this->resolveSchoolYear($request, $section);

        $enrollments = Enrollment::query()
            ->with('student')
            ->when($section, fn ($q) => $q->where('section_id', $section->id))
            ->when($schoolYear, fn ($q) => $q->where('school_year_id', $schoolYear->id))
            ->get();

        $rows = $enrollments->map(function (Enrollment $e) {
            $finals = StudentGrade::where('enrollment_id', $e->id)->whereNotNull('final_grade')->pluck('final_grade');
            $avg = $finals->count() > 0 ? round((float) $finals->avg(), 2) : null;

            return [
                'lrn' => $e->student->lrn,
                'name' => $e->student->last_name.', '.$e->student->first_name,
                'general_average' => $avg,
                'remarks' => $e->status,
            ];
        })->sortBy('name')->values()->toArray();

        $pdf = Pdf::loadView('reports.sf5', [
            'title' => 'School Form 5 — Report on Promotion',
            'school' => $this->schoolMeta(),
            'section' => $section,
            'schoolYear' => $schoolYear,
            'rows' => $rows,
        ])->setPaper('legal', 'landscape');

        return $pdf->download($this->pdfFilename('SF5', $section, $schoolYear));
    }

    public function form137(Request $request): Response
    {
        $request->validate(['student_id' => 'required|integer|exists:students,id']);
        $student = Student::findOrFail($request->integer('student_id'));
        $this->authorizeParentStudent($request, $student->id);

        $enrollments = Enrollment::query()
            ->with(['gradeLevel', 'section', 'schoolYear'])
            ->where('student_id', $student->id)
            ->orderBy('school_year_id')
            ->get();

        $enrollments->each(function (Enrollment $enrollment) {
            $grades = StudentGrade::with(['subject', 'quarter'])
                ->where('enrollment_id', $enrollment->id)
                ->get();

            $grouped = [];
            foreach ($grades as $g) {
                $name = $g->subject?->name ?? 'Subject';
                if (! isset($grouped[$name])) {
                    $grouped[$name] = ['subject' => $name, 'Q1' => null, 'Q2' => null, 'Q3' => null, 'Q4' => null, 'final' => null, 'remarks' => null];
                }
                $key = 'Q'.$g->quarter?->quarter_number;
                if (in_array($key, ['Q1','Q2','Q3','Q4'], true)) {
                    $grouped[$name][$key] = $g->quarterly_grade;
                }
                if ($g->final_grade !== null) {
                    $grouped[$name]['final'] = (float) $g->final_grade;
                    $grouped[$name]['remarks'] = $g->final_grade >= 75 ? 'Passed' : 'Failed';
                }
            }
            $enrollment->setAttribute('grades_grouped', array_values($grouped));
        });

        $pdf = Pdf::loadView('reports.form137', [
            'title' => 'Form 137 — Permanent Record',
            'school' => $this->schoolMeta(),
            'student' => $student,
            'enrollments' => $enrollments,
        ]);

        return $pdf->download($this->pdfFilename('Form137_'.$student->last_name, null, null));
    }

    public function form138(Request $request, Sf9ReportCardService $sf9): BinaryFileResponse
    {
        $request->validate([
            'student_id' => 'required|integer|exists:students,id',
            'school_year_id' => 'sometimes|integer|exists:school_years,id',
        ]);
        $student = Student::findOrFail($request->integer('student_id'));
        $this->authorizeParentStudent($request, $student->id);

        $report = $sf9->buildForStudent(
            $student->id,
            $request->filled('school_year_id') ? $request->integer('school_year_id') : null,
        );

        $report['spreadsheet']->getActiveSheet()->getPageSetup()
            ->setOrientation(PageSetup::ORIENTATION_LANDSCAPE)
            ->setPaperSize(PageSetup::PAPERSIZE_A4);

        File::ensureDirectoryExists(storage_path('app/reports'));
        $path = storage_path('app/reports/form138_'.uniqid('', true).'.pdf');
        (new SpreadsheetDompdf($report['spreadsheet']))->save($path);
        /* Legacy Blade title removed; the filled spreadsheet now drives the PDF layout.

            'title' => 'Form 138 — Learner\'s Progress Report',
        */
        return response()
            ->download($path, $this->pdfFilename('Form138_'.$student->last_name, null, $report['enrollment']->schoolYear))
            ->deleteFileAfterSend();
    }

    public function goodMoral(Request $request): Response
    {
        $request->validate([
            'student_id' => 'required|integer|exists:students,id',
            'school_year_id' => 'sometimes|integer|exists:school_years,id',
        ]);

        $student = Student::findOrFail($request->integer('student_id'));
        $this->authorizeParentStudent($request, $student->id);

        $enrollment = Enrollment::query()
            ->with(['gradeLevel', 'section', 'schoolYear'])
            ->where('student_id', $student->id)
            ->when($request->filled('school_year_id'), fn ($q) => $q->where('school_year_id', $request->integer('school_year_id')))
            ->orderByDesc('id')
            ->first();

        $pdf = Pdf::loadView('reports.good-moral', [
            'title' => 'Certificate of Good Moral Character',
            'school' => $this->schoolMeta(),
            'student' => $student,
            'enrollment' => $enrollment,
            'issuedAt' => now(),
        ]);

        return $pdf->download($this->pdfFilename('GoodMoral_'.$student->last_name, null, $enrollment?->schoolYear));
    }

    public function pir(Request $request): Response
    {
        $schoolYear = $this->resolveSchoolYear($request, null);

        $totalStudents = Enrollment::query()
            ->when($schoolYear, fn ($q) => $q->where('school_year_id', $schoolYear->id))
            ->where('status', 'enrolled')->count();

        $male = Student::query()->where('gender', 'Male')->whereHas('enrollments', function ($q) use ($schoolYear) {
            $q->when($schoolYear, fn ($e) => $e->where('school_year_id', $schoolYear->id))->where('status', 'enrolled');
        })->count();
        $female = Student::query()->where('gender', 'Female')->whereHas('enrollments', function ($q) use ($schoolYear) {
            $q->when($schoolYear, fn ($e) => $e->where('school_year_id', $schoolYear->id))->where('status', 'enrolled');
        })->count();

        $sectionsCount = Section::query()
            ->when($schoolYear, fn ($q) => $q->where('school_year_id', $schoolYear->id))
            ->count();

        $indicators = [
            ['label' => 'Total Enrollment', 'value' => $totalStudents],
            ['label' => 'Male', 'value' => $male],
            ['label' => 'Female', 'value' => $female],
            ['label' => 'Sections', 'value' => $sectionsCount],
        ];

        $promotion = GradeLevel::orderBy('id')->get()->map(function (GradeLevel $gl) use ($schoolYear) {
            $enrollments = Enrollment::query()
                ->where('grade_level_id', $gl->id)
                ->when($schoolYear, fn ($q) => $q->where('school_year_id', $schoolYear->id))
                ->where('status', 'enrolled')
                ->get();

            $promoted = $enrollments->filter(function (Enrollment $e) {
                $finals = StudentGrade::where('enrollment_id', $e->id)->whereNotNull('final_grade')->pluck('final_grade');
                if ($finals->isEmpty()) {
                    return false;
                }
                return $finals->avg() >= 75;
            })->count();

            $retained = $enrollments->count() - $promoted;
            $rate = $enrollments->count() > 0 ? round(($promoted / $enrollments->count()) * 100, 2) : 0;

            return [
                'grade_level' => $gl->name,
                'enrolled' => $enrollments->count(),
                'promoted' => $promoted,
                'retained' => $retained,
                'rate' => $rate,
            ];
        })->toArray();

        $pdf = Pdf::loadView('reports.pir', [
            'title' => 'Performance Indicators Report (PIR)',
            'school' => $this->schoolMeta(),
            'schoolYear' => $schoolYear,
            'indicators' => $indicators,
            'promotion' => $promotion,
        ])->setPaper('a4', 'portrait');

        return $pdf->download($this->pdfFilename('PIR', null, $schoolYear));
    }

    private function buildAttendanceMatrix(Enrollment $enrollment): array
    {
        $matrix = ['Q1' => ['present' => 0, 'absent' => 0, 'late' => 0],
            'Q2' => ['present' => 0, 'absent' => 0, 'late' => 0],
            'Q3' => ['present' => 0, 'absent' => 0, 'late' => 0],
            'Q4' => ['present' => 0, 'absent' => 0, 'late' => 0],
            'total' => ['present' => 0, 'absent' => 0, 'late' => 0],
        ];

        $quarters = Quarter::orderBy('quarter_number')->get();
        $records = AttendanceRecord::where('enrollment_id', $enrollment->id)->get();

        foreach ($records as $rec) {
            $key = 'total';
            foreach ($quarters as $q) {
                if ($q->start_date && $q->end_date && $rec->date->between($q->start_date, $q->end_date)) {
                    $key = 'Q'.$q->quarter_number;
                    break;
                }
            }
            foreach (['am_status', 'pm_status'] as $col) {
                $val = $rec->{$col};
                if ($val === 'present') {
                    $matrix[$key]['present']++;
                    $matrix['total']['present']++;
                } elseif ($val === 'absent') {
                    $matrix[$key]['absent']++;
                    $matrix['total']['absent']++;
                } elseif ($val === 'late') {
                    $matrix[$key]['late']++;
                    $matrix['total']['late']++;
                }
            }
        }

        return $matrix;
    }

    private function authorizeParentStudent(Request $request, int $studentId): void
    {
        $user = $request->user();
        if ($user?->role !== 'parent') {
            return;
        }

        $parent = ParentGuardian::query()
            ->where('user_id', $user->id)
            ->orWhere('email', $user->email)
            ->first();

        $isLinked = $parent?->students()->where('students.id', $studentId)->exists() ?? false;
        if (! $isLinked) {
            abort(403, 'This learner is not linked to your guardian account.');
        }
    }
}
