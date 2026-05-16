<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassSchedule;
use App\Models\SchoolYear;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClassScheduleController extends Controller
{
    private const DAY_TO_INT = [
        'monday' => 1,
        'tuesday' => 2,
        'wednesday' => 3,
        'thursday' => 4,
        'friday' => 5,
        'saturday' => 6,
        'sunday' => 7,
    ];

    private const INT_TO_DAY = [
        1 => 'Monday',
        2 => 'Tuesday',
        3 => 'Wednesday',
        4 => 'Thursday',
        5 => 'Friday',
        6 => 'Saturday',
        7 => 'Sunday',
    ];

    public function index(Request $request): JsonResponse
    {
        $query = ClassSchedule::query()->with([
            'section:id,name,grade_level_id,adviser_id',
            'section.gradeLevel:id,name',
            'subject:id,name',
            'faculty:id,first_name,last_name,position',
        ])
            ->when($request->filled('section_id'), fn ($q) => $q->where('section_id', $request->input('section_id')))
            ->when($request->filled('subject_id'), fn ($q) => $q->where('subject_id', $request->input('subject_id')))
            ->when($request->filled('faculty_id'), fn ($q) => $q->where('faculty_id', $request->input('faculty_id')))
            ->when($request->filled('day_of_week'), fn ($q) => $q->where('day_of_week', $this->dayToInt($request->input('day_of_week'))));

        $records = $query->orderBy('day_of_week')->orderBy('time_start')
            ->limit(min((int) $request->query('limit', 500), 2000))
            ->get();

        return response()->json([
            'data' => $records->map(fn ($r) => $this->present($r))->values(),
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $record = ClassSchedule::with(['section.gradeLevel', 'subject', 'faculty'])->findOrFail($id);
        return response()->json(['data' => $this->present($record)]);
    }

    public function store(Request $request): JsonResponse
    {
        $payload = $this->validatePayload($request);
        $record = ClassSchedule::create($this->prepare($payload));
        $record->load(['section.gradeLevel', 'subject', 'faculty']);
        return response()->json(['data' => $this->present($record)], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $record = ClassSchedule::findOrFail($id);
        $payload = $this->validatePayload($request);
        $record->fill($this->prepare($payload))->save();
        $record->load(['section.gradeLevel', 'subject', 'faculty']);
        return response()->json(['data' => $this->present($record)]);
    }

    public function destroy(string $id): JsonResponse
    {
        $record = ClassSchedule::findOrFail($id);
        $record->delete();
        return response()->json(['data' => true]);
    }

    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'school_year_id' => ['nullable', 'integer', 'exists:school_years,id'],
            'section_id' => ['required', 'integer', 'exists:sections,id'],
            'subject_id' => ['nullable', 'integer', 'exists:subjects,id'],
            'faculty_id' => ['nullable', 'integer', 'exists:faculty,id'],
            'day_of_week' => ['required'],
            'day' => ['nullable', 'string'],
            'time_start' => ['required', 'string'],
            'time_end' => ['required', 'string'],
        ]);
<<<<<<< Updated upstream
=======

        $section = Section::query()
            ->with('gradeLevel:id,name')
            ->select(['id', 'grade_level_id', 'adviser_id'])
            ->findOrFail($payload['section_id']);
        $isKinder = $this->isKindergartenSplitGrade($section->gradeLevel?->name);

        if ($isKinder) {
            if (! empty($payload['subject_id'])) {
                throw ValidationException::withMessages([
                    'subject_id' => 'Kindergarten 1 and Kindergarten 2 schedules do not use subjects.',
                ]);
            }

            $faculty = Faculty::query()
                ->select(['id', 'user_id'])
                ->where('user_id', $section->adviser_id)
                ->first();

            if (! $faculty) {
                throw ValidationException::withMessages([
                    'faculty_id' => 'Assign a section adviser who has a teacher roster row before scheduling Kindergarten 1 or 2.',
                ]);
            }

            $payload['subject_id'] = null;
            $payload['faculty_id'] = $faculty->id;

            return $payload;
        }

        if (empty($payload['subject_id'])) {
            throw ValidationException::withMessages([
                'subject_id' => 'Select a subject for this section.',
            ]);
        }

        $subjectMatchesGradeLevel = Subject::query()
            ->whereKey($payload['subject_id'])
            ->whereIn('subjects.id', function ($subquery) use ($section) {
                $subquery
                    ->select('grade_level_subjects.subject_id')
                    ->from('grade_level_subjects')
                    ->where('grade_level_subjects.grade_level_id', $section->grade_level_id)
                    ->whereRaw('grade_level_subjects.id = (
                        select min(primary_grade_level_subjects.id)
                        from grade_level_subjects as primary_grade_level_subjects
                        where primary_grade_level_subjects.subject_id = grade_level_subjects.subject_id
                    )');
            })
            ->exists();

        if (! $subjectMatchesGradeLevel) {
            throw ValidationException::withMessages([
                'subject_id' => 'The selected subject is not assigned to the selected section grade level.',
            ]);
        }

        if (! empty($payload['faculty_id'])) {
            $subject = Subject::query()->select(['id', 'department_id'])->findOrFail($payload['subject_id']);
            $faculty = Faculty::query()->select(['id', 'department_id'])->findOrFail($payload['faculty_id']);
            $subjectDepartmentId = $subject->department_id;
            $facultyDepartmentId = $faculty->department_id;

            if ((int) $subjectDepartmentId !== (int) $facultyDepartmentId || ($subjectDepartmentId === null) !== ($facultyDepartmentId === null)) {
                throw ValidationException::withMessages([
                    'faculty_id' => 'The selected teacher is not assigned to the selected subject department.',
                ]);
            }
        }

        return $payload;
>>>>>>> Stashed changes
    }

    private function prepare(array $payload): array
    {
        return [
            'school_year_id' => $payload['school_year_id'] ?? SchoolYear::active()?->id,
            'section_id' => $payload['section_id'],
            'subject_id' => $payload['subject_id'] ?? null,
            'faculty_id' => $payload['faculty_id'] ?? null,
            'day_of_week' => $this->dayToInt($payload['day_of_week'] ?? $payload['day'] ?? 1),
            'time_start' => $this->normalizeTime($payload['time_start']),
            'time_end' => $this->normalizeTime($payload['time_end']),
        ];
    }

    private function isKindergartenSplitGrade(?string $gradeLevel): bool
    {
        return in_array(strtolower((string) $gradeLevel), ['kindergarten 1', 'kindergarten 2'], true);
    }

    private function dayToInt($value): int
    {
        if (is_numeric($value)) {
            return max(1, min(7, (int) $value));
        }
        $key = strtolower((string) $value);
        return self::DAY_TO_INT[$key] ?? 1;
    }

    private function normalizeTime(string $time): string
    {
        $time = trim($time);
        $ts = strtotime($time);
        if ($ts === false) return $time;
        return date('H:i:s', $ts);
    }

    private function present(ClassSchedule $record): array
    {
        $section = $record->section;
        $subject = $record->subject;
        $faculty = $record->faculty;
        $gradeLevel = $section?->gradeLevel?->name;

        return [
            'id' => $record->id,
            'school_year_id' => $record->school_year_id,
            'section_id' => $record->section_id,
            'section' => $section ? trim(($section->name ?? '').($gradeLevel ? " ($gradeLevel)" : '')) : null,
            'section_name' => $section?->name,
            'grade_level' => $gradeLevel,
            'subject_id' => $record->subject_id,
            'subject' => $subject?->name ?? ($this->isKindergartenSplitGrade($gradeLevel) ? 'Kindergarten adviser' : null),
            'faculty_id' => $record->faculty_id,
            'teacher' => $faculty ? trim($faculty->first_name.' '.$faculty->last_name) : null,
            'day_of_week' => $record->day_of_week,
            'day' => self::INT_TO_DAY[$record->day_of_week] ?? 'Monday',
            'time_start' => $record->time_start ? substr($record->time_start, 0, 5) : null,
            'time_end' => $record->time_end ? substr($record->time_end, 0, 5) : null,
            'created_at' => $record->created_at?->toIso8601String(),
            'updated_at' => $record->updated_at?->toIso8601String(),
        ];
    }
}
