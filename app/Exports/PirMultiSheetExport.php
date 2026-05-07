<?php

namespace App\Exports;

use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\SchoolYear;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentGrade;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

final class PirMultiSheetExport implements WithMultipleSheets
{
    public function __construct(private readonly ?SchoolYear $schoolYear)
    {
    }

    public function sheets(): array
    {
        $schoolYear = $this->schoolYear;

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

        $summary = new HeadingRowsExport(
            ['Indicator', 'Value'],
            [
                ['Total Enrollment', $totalStudents],
                ['Male', $male],
                ['Female', $female],
                ['Sections', $sectionsCount],
            ],
            'Summary',
        );

        $gradeLevels = GradeLevel::orderBy('id')->get();
        $promoRows = [];
        foreach ($gradeLevels as $gl) {
            $enrolled = Enrollment::query()
                ->where('grade_level_id', $gl->id)
                ->when($schoolYear, fn ($q) => $q->where('school_year_id', $schoolYear->id))
                ->where('status', 'enrolled')
                ->get();

            $promoted = $enrolled->filter(function (Enrollment $e) {
                $finals = StudentGrade::where('enrollment_id', $e->id)->whereNotNull('final_grade')->pluck('final_grade');
                if ($finals->isEmpty()) {
                    return false;
                }

                return $finals->avg() >= 75;
            })->count();

            $promoRows[] = [
                $gl->name,
                $enrolled->count(),
                $promoted,
                $enrolled->count() - $promoted,
                $enrolled->count() > 0 ? round(($promoted / $enrolled->count()) * 100, 2) : 0,
            ];
        }

        $byGrade = new HeadingRowsExport(
            ['Grade Level', 'Enrolled', 'Promoted', 'Retained', 'Promotion Rate %'],
            $promoRows,
            'By Grade',
        );

        return [$summary, $byGrade];
    }
}
