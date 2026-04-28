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
            'section:id,name,grade_level_id',
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
            'subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'faculty_id' => ['nullable', 'integer', 'exists:faculty,id'],
            'day_of_week' => ['required'],
            'day' => ['nullable', 'string'],
            'time_start' => ['required', 'string'],
            'time_end' => ['required', 'string'],
        ]);
    }

    private function prepare(array $payload): array
    {
        return [
            'school_year_id' => $payload['school_year_id'] ?? SchoolYear::active()?->id,
            'section_id' => $payload['section_id'],
            'subject_id' => $payload['subject_id'],
            'faculty_id' => $payload['faculty_id'] ?? null,
            'day_of_week' => $this->dayToInt($payload['day_of_week'] ?? $payload['day'] ?? 1),
            'time_start' => $this->normalizeTime($payload['time_start']),
            'time_end' => $this->normalizeTime($payload['time_end']),
        ];
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
            'subject' => $subject?->name,
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
