<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SchoolYear;
use App\Models\Student;
use App\Models\TransferRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransferController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $records = TransferRecord::query()
            ->with([
                'student:id,first_name,last_name,lrn',
                'fromSection:id,name',
                'toSection:id,name',
                'schoolYear:id,label',
            ])
            ->when($request->filled('student_id'), fn ($q) => $q->where('student_id', $request->input('student_id')))
            ->when($request->filled('transfer_type'), fn ($q) => $q->where('transfer_type', $request->input('transfer_type')))
            ->when($request->filled('school_year_id'), fn ($q) => $q->where('school_year_id', $request->input('school_year_id')))
            ->orderByDesc('transfer_date')
            ->limit(min((int) $request->query('limit', 200), 1000))
            ->get();

        return response()->json([
            'data' => $records->map(fn ($r) => $this->present($r))->values(),
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $record = TransferRecord::with(['student', 'fromSection', 'toSection', 'schoolYear'])->findOrFail($id);
        return response()->json(['data' => $this->present($record)]);
    }

    public function store(Request $request): JsonResponse
    {
        $payload = $this->validatePayload($request);
        $payload['processed_by'] = $request->user()?->id;

        $record = DB::transaction(function () use ($payload) {
            $record = TransferRecord::create($this->prepare($payload));

            if ($record->transfer_type === 'transferred_out') {
                Student::where('id', $record->student_id)->update(['status' => 'transferred_out']);
            } elseif ($record->transfer_type === 'transferred_in') {
                Student::where('id', $record->student_id)->update(['status' => 'transferred_in']);
            } elseif ($record->transfer_type === 'dropped') {
                Student::where('id', $record->student_id)->update(['status' => 'dropped']);
            }

            return $record;
        });

        $record->load(['student', 'fromSection', 'toSection', 'schoolYear']);
        return response()->json(['data' => $this->present($record)], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $record = TransferRecord::findOrFail($id);
        $payload = $this->validatePayload($request);
        $record->fill($this->prepare($payload))->save();
        $record->load(['student', 'fromSection', 'toSection', 'schoolYear']);
        return response()->json(['data' => $this->present($record)]);
    }

    public function destroy(string $id): JsonResponse
    {
        $record = TransferRecord::findOrFail($id);
        $record->delete();
        return response()->json(['data' => true]);
    }

    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'student_id' => ['required', 'integer', 'exists:students,id'],
            'school_year_id' => ['nullable', 'integer', 'exists:school_years,id'],
            'transfer_type' => ['required', 'string', 'in:transferred_in,transferred_out,dropped,section_change'],
            'transfer_date' => ['required', 'date'],
            'quarter_at_transfer' => ['nullable', 'string'],
            'from_section_id' => ['nullable', 'integer', 'exists:sections,id'],
            'to_section_id' => ['nullable', 'integer', 'exists:sections,id'],
            'from_school' => ['nullable', 'string', 'max:191'],
            'to_school' => ['nullable', 'string', 'max:191'],
            'reason' => ['nullable', 'string'],
            'documents_received' => ['nullable', 'array'],
            'processed_by' => ['nullable', 'integer'],
        ]);
    }

    private function prepare(array $payload): array
    {
        return [
            'student_id' => $payload['student_id'],
            'school_year_id' => $payload['school_year_id'] ?? SchoolYear::active()?->id,
            'transfer_type' => $payload['transfer_type'],
            'transfer_date' => $payload['transfer_date'],
            'quarter_at_transfer' => $payload['quarter_at_transfer'] ?? null,
            'from_section_id' => $payload['from_section_id'] ?? null,
            'to_section_id' => $payload['to_section_id'] ?? null,
            'from_school' => $payload['from_school'] ?? null,
            'to_school' => $payload['to_school'] ?? null,
            'reason' => $payload['reason'] ?? null,
            'documents_received' => $payload['documents_received'] ?? null,
            'processed_by' => $payload['processed_by'] ?? null,
        ];
    }

    private function present(TransferRecord $record): array
    {
        $student = $record->student;

        return [
            'id' => $record->id,
            'student_id' => $record->student_id,
            'student_name' => $student ? trim($student->last_name.', '.$student->first_name) : null,
            'lrn' => $student?->lrn,
            'school_year_id' => $record->school_year_id,
            'school_year' => $record->schoolYear?->label,
            'transfer_type' => $record->transfer_type,
            'transfer_date' => $record->transfer_date?->toDateString(),
            'quarter_at_transfer' => $record->quarter_at_transfer,
            'from_section_id' => $record->from_section_id,
            'from_section' => $record->fromSection?->name,
            'to_section_id' => $record->to_section_id,
            'to_section' => $record->toSection?->name,
            'from_school' => $record->from_school,
            'to_school' => $record->to_school,
            'reason' => $record->reason,
            'documents_received' => $record->documents_received,
            'processed_by' => $record->processed_by,
            'created_at' => $record->created_at?->toIso8601String(),
            'updated_at' => $record->updated_at?->toIso8601String(),
        ];
    }
}
