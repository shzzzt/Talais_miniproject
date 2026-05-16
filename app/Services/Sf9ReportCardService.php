<?php

namespace App\Services;

use App\Models\Enrollment;
use App\Models\GradeLevelSubject;
use App\Models\Quarter;
use App\Models\Student;
use App\Models\StudentGrade;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class Sf9ReportCardService
{
    private const QUARTER_COLUMNS = [1 => 'C', 2 => 'D', 3 => 'E', 4 => 'F'];

    /** @return array{student: Student, enrollment: Enrollment, spreadsheet: Spreadsheet} */
    public function buildForStudent(int $studentId, ?int $schoolYearId = null): array
    {
        $student = Student::findOrFail($studentId);
        $enrollment = $this->resolveEnrollment($student, $schoolYearId);
        $spreadsheet = IOFactory::load($this->templatePath($enrollment));

        $this->fillWorkbook($spreadsheet, $student, $enrollment);

        return compact('student', 'enrollment', 'spreadsheet');
    }

    /** @return array{created:int,updated:int,skipped_subjects:list<string>} */
    public function importForStudent(UploadedFile $file, int $studentId, ?int $schoolYearId, ?int $userId): array
    {
        $student = Student::findOrFail($studentId);
        $enrollment = $this->resolveEnrollment($student, $schoolYearId);
        $sheet = IOFactory::load($file->getRealPath())->getActiveSheet();
        $subjectRows = $this->subjectRows($sheet);
        $subjects = $this->subjectsByTemplateLabel($enrollment);
        $quarterIds = $this->quarterIds($enrollment);
        $created = 0;
        $updated = 0;
        $skipped = [];

        DB::transaction(function () use ($sheet, $subjectRows, $subjects, $quarterIds, $enrollment, $userId, &$created, &$updated, &$skipped) {
            foreach ($subjectRows as $label => $row) {
                $subject = $subjects[$this->normalizeLabel($label)] ?? null;
                if (! $subject) {
                    $skipped[] = $label;
                    continue;
                }

                foreach (self::QUARTER_COLUMNS as $quarterNumber => $column) {
                    $value = $this->numericGrade($sheet->getCell($column.$row)->getCalculatedValue());
                    if ($value === null || ! isset($quarterIds[$quarterNumber])) {
                        continue;
                    }

                    $grade = StudentGrade::firstOrNew([
                        'enrollment_id' => $enrollment->id,
                        'subject_id' => $subject->id,
                        'quarter_id' => $quarterIds[$quarterNumber],
                    ]);
                    $grade->quarterly_grade = $value;
                    $grade->final_grade = $value;
                    $grade->remarks = $value >= 75 ? 'Passed' : 'Failed';
                    $grade->encoded_by = $userId;
                    $grade->validated_by = $userId;
                    $grade->validated_at = now();
                    $grade->exists ? $updated++ : $created++;
                    $grade->save();
                }

                $this->recomputeFinal($enrollment->id, $subject->id, $userId);
            }
        });

        return [
            'created' => $created,
            'updated' => $updated,
            'skipped_subjects' => array_values(array_unique($skipped)),
        ];
    }

    public function fillWorkbook(Spreadsheet $spreadsheet, Student $student, Enrollment $enrollment): void
    {
        $sheet = $spreadsheet->getActiveSheet();
        $subjectRows = $this->subjectRows($sheet);
        $grades = $this->gradesByTemplateLabel($enrollment);

        $sheet->setCellValue('A'.$this->nextAvailableRow($sheet), sprintf(
            'Learner: %s | LRN: %s | Grade/Section: %s - %s | SY: %s | Adviser: %s',
            trim($student->last_name.', '.$student->first_name.' '.$student->middle_name),
            $student->lrn,
            $enrollment->gradeLevel?->name ?? '',
            $enrollment->section?->name ?? '',
            $enrollment->schoolYear?->label ?? '',
            $enrollment->section?->adviser?->name ?? ''
        ));

        foreach ($subjectRows as $label => $row) {
            $data = $grades[$this->normalizeLabel($label)] ?? null;
            if (! $data) {
                continue;
            }

            foreach (self::QUARTER_COLUMNS as $quarterNumber => $column) {
                $sheet->setCellValue($column.$row, $data['quarters'][$quarterNumber] ?? null);
            }
            $sheet->setCellValue('G'.$row, $data['final']);
            $sheet->setCellValue($this->remarksColumn($sheet).$row, $data['remarks']);
        }

        $averageRow = $this->findRowByLabel($sheet, 'General Average');
        if ($averageRow) {
            foreach (self::QUARTER_COLUMNS as $quarterNumber => $column) {
                $values = collect($grades)->pluck("quarters.$quarterNumber")->filter(fn ($v) => $v !== null);
                $sheet->setCellValue($column.$averageRow, $values->isEmpty() ? null : round((float) $values->avg(), 2));
            }

            $finals = collect($grades)->pluck('final')->filter(fn ($v) => $v !== null);
            $general = $finals->isEmpty() ? null : round((float) $finals->avg(), 2);
            $sheet->setCellValue('G'.$averageRow, $general);
            $sheet->setCellValue($this->remarksColumn($sheet).$averageRow, $general === null ? null : ($general >= 75 ? 'Passed' : 'Failed'));
        }
    }

    private function resolveEnrollment(Student $student, ?int $schoolYearId): Enrollment
    {
        return Enrollment::query()
            ->with(['gradeLevel', 'section.adviser', 'schoolYear'])
            ->where('student_id', $student->id)
            ->when($schoolYearId, fn ($q) => $q->where('school_year_id', $schoolYearId))
            ->orderByDesc('id')
            ->firstOrFail();
    }

    private function templatePath(Enrollment $enrollment): string
    {
        $grade = $this->gradeNumber($enrollment);
        $file = match ($grade) {
            1 => 'grade-1.xlsx',
            2 => 'grade-2.xlsx',
            3 => 'grade-3.xlsx',
            4, 5 => 'grade-4-5.xlsx',
            6 => 'grade-6.xlsx',
            default => abort(422, 'SF9/Form 138 templates are configured for Grades 1 to 6 only.'),
        };

        return resource_path('templates/sf9/'.$file);
    }

    private function gradeNumber(Enrollment $enrollment): ?int
    {
        preg_match('/grade\s*(\d+)/i', (string) $enrollment->gradeLevel?->name, $matches);

        return isset($matches[1]) ? (int) $matches[1] : null;
    }

    /** @return array<string, int> */
    private function subjectRows(Worksheet $sheet): array
    {
        $rows = [];
        $generalAverageRow = $this->findRowByLabel($sheet, 'General Average') ?? ($sheet->getHighestRow() + 1);

        for ($row = 1; $row <= $sheet->getHighestRow(); $row++) {
            $label = trim((string) $sheet->getCell('A'.$row)->getFormattedValue());
            if ($row >= $generalAverageRow || $label === '') {
                continue;
            }
            if ($row < 6 || $row > 18) {
                continue;
            }
            $rows[$label] = $row;
        }

        return $rows;
    }

    /** @return array<string, array{quarters: array<int, ?float>, final: ?float, remarks: ?string}> */
    private function gradesByTemplateLabel(Enrollment $enrollment): array
    {
        $grades = StudentGrade::query()
            ->with(['subject', 'quarter'])
            ->where('enrollment_id', $enrollment->id)
            ->get();

        $grouped = [];
        foreach ($grades as $grade) {
            $labels = $this->templateAliases((string) $grade->subject?->name);
            foreach ($labels as $label) {
                $key = $this->normalizeLabel($label);
                $grouped[$key] ??= ['quarters' => [1 => null, 2 => null, 3 => null, 4 => null], 'final' => null, 'remarks' => null];
                $quarterNumber = $grade->quarter?->quarter_number;
                if ($quarterNumber >= 1 && $quarterNumber <= 4) {
                    $grouped[$key]['quarters'][$quarterNumber] = $grade->quarterly_grade === null ? null : (float) $grade->quarterly_grade;
                }
                if ($grade->final_grade !== null) {
                    $grouped[$key]['final'] = (float) $grade->final_grade;
                    $grouped[$key]['remarks'] = $grade->final_grade >= 75 ? 'Passed' : 'Failed';
                }
            }
        }

        return $grouped;
    }

    /** @return array<string, object> */
    private function subjectsByTemplateLabel(Enrollment $enrollment): array
    {
        return GradeLevelSubject::query()
            ->with('subject')
            ->where('grade_level_id', $enrollment->grade_level_id)
            ->get()
            ->flatMap(function (GradeLevelSubject $row) {
                return collect($this->templateAliases((string) $row->subject?->name))
                    ->mapWithKeys(fn ($label) => [$this->normalizeLabel($label) => $row->subject]);
            })
            ->all();
    }

    /** @return list<string> */
    private function templateAliases(string $subjectName): array
    {
        $aliases = [$subjectName];
        $key = $this->normalizeLabel($subjectName);

        return match ($key) {
            'edukasyonsapagpapakatao', 'esp', 'gmrcandvalueseducation' => [...$aliases, 'GMRC'],
            'readingandliteracy', 'readingliteracy', 'mothertongue' => [...$aliases, 'Reading and Literacy', 'Language'],
            'aralingpanlipunan' => [...$aliases, 'Makabansa'],
            'tle', 'epp', 'epptle', 'informationcommunicationtechnology' => [...$aliases, 'EPP/TLE'],
            'visualarts' => [...$aliases, 'Arts', 'Music & Arts'],
            'music' => [...$aliases, 'Music', 'Music & Arts'],
            'physicaleducation' => [...$aliases, 'PE', 'PE & Health'],
            'healtheducation' => [...$aliases, 'Health', 'PE & Health'],
            default => $aliases,
        };
    }

    /** @return array<int, int> */
    private function quarterIds(Enrollment $enrollment): array
    {
        return Quarter::query()
            ->when($enrollment->school_year_id, fn ($q) => $q->where('school_year_id', $enrollment->school_year_id))
            ->orderBy('quarter_number')
            ->get()
            ->pluck('id', 'quarter_number')
            ->all();
    }

    private function recomputeFinal(int $enrollmentId, int $subjectId, ?int $userId): void
    {
        $values = StudentGrade::where('enrollment_id', $enrollmentId)
            ->where('subject_id', $subjectId)
            ->whereNotNull('quarterly_grade')
            ->pluck('quarterly_grade');

        if ($values->isEmpty()) {
            return;
        }

        $final = round((float) $values->avg(), 2);
        StudentGrade::where('enrollment_id', $enrollmentId)
            ->where('subject_id', $subjectId)
            ->update([
                'final_grade' => $final,
                'remarks' => $final >= 75 ? 'Passed' : 'Failed',
                'validated_by' => $userId,
                'validated_at' => now(),
            ]);
    }

    private function findRowByLabel(Worksheet $sheet, string $needle): ?int
    {
        $target = $this->normalizeLabel($needle);
        for ($row = 1; $row <= $sheet->getHighestRow(); $row++) {
            if ($this->normalizeLabel((string) $sheet->getCell('A'.$row)->getFormattedValue()) === $target) {
                return $row;
            }
        }

        return null;
    }

    private function remarksColumn(Worksheet $sheet): string
    {
        $highest = Coordinate::columnIndexFromString($sheet->getHighestColumn());
        for ($row = 1; $row <= 5; $row++) {
            for ($col = 1; $col <= $highest; $col++) {
                $coordinate = Coordinate::stringFromColumnIndex($col).$row;
                if ($this->normalizeLabel((string) $sheet->getCell($coordinate)->getFormattedValue()) === 'remarks') {
                    return Coordinate::stringFromColumnIndex($col);
                }
            }
        }

        return 'I';
    }

    private function nextAvailableRow(Worksheet $sheet): int
    {
        return $sheet->getHighestRow() + 2;
    }

    private function numericGrade(mixed $value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_string($value)) {
            $value = trim(str_replace('%', '', $value));
        }

        return is_numeric($value) ? max(0, min(100, round((float) $value, 2))) : null;
    }

    private function normalizeLabel(string $value): string
    {
        return Str::of($value)->lower()->replaceMatches('/[^a-z0-9]+/', '')->toString();
    }
}
