<?php

namespace App\Http\Controllers\Concerns;

use App\Models\SchoolYear;
use App\Models\Section;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

trait ReportsSchoolContext
{
    protected function resolveSection(Request $request): ?Section
    {
        if (! $request->filled('section_id')) {
            return null;
        }

        return Section::with(['gradeLevel', 'adviser'])->findOrFail($request->integer('section_id'));
    }

    protected function resolveSchoolYear(Request $request, ?Section $section): ?SchoolYear
    {
        if ($request->filled('school_year_id')) {
            return SchoolYear::find($request->integer('school_year_id'));
        }
        if ($section?->school_year_id) {
            return SchoolYear::find($section->school_year_id);
        }

        return SchoolYear::active() ?? SchoolYear::orderByDesc('id')->first();
    }

    /**
     * @return array{name: string, division: string, district: string, municipality: string, school_id: string, principal: string}
     */
    protected function schoolMeta(): array
    {
        $defaults = [
            'name' => 'Musuan Integrated School',
            'division' => 'Division of Bukidnon',
            'district' => 'Maramag District',
            'municipality' => 'Maramag',
            'school_id' => '300003',
            'principal' => 'Dr. Weenkie Jhon A. Marcelo',
        ];
        $cached = Cache::get('talais.school.settings', []);

        return array_merge($defaults, $cached);
    }

    protected function pdfFilename(string $prefix, ?Section $section, ?SchoolYear $year): string
    {
        $parts = array_filter([
            $prefix,
            $section?->name,
            $year?->label,
            now()->format('Ymd'),
        ]);

        return implode('_', $parts).'.pdf';
    }

    protected function excelBasename(string $prefix, ?Section $section, ?SchoolYear $year): string
    {
        $parts = array_filter([
            $prefix,
            $section?->name,
            $year?->label,
            now()->format('Ymd'),
        ]);

        return implode('_', $parts).'.xlsx';
    }
}
