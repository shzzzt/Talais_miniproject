<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;

final class HeadingRowsExport implements FromCollection, WithHeadings, WithTitle
{
    /**
     * @param  array<int, string>  $headings
     * @param  iterable<int, array<int, mixed>|array<string, mixed>>  $rows
     */
    public function __construct(
        private readonly array $headings,
        private readonly iterable $rows,
        private readonly string $sheetTitle = 'Sheet1',
    ) {
    }

    public function title(): string
    {
        $t = preg_replace('/[\[\]:*?\/\\\\]/', '_', $this->sheetTitle) ?: 'Sheet1';

        return mb_substr($t, 0, 31);
    }

    public function headings(): array
    {
        return $this->headings;
    }

    public function collection(): Collection
    {
        return collect($this->rows)->map(function ($row): array {
            if (! is_array($row)) {
                return [];
            }
            if ($this->isList($row)) {
                return $row;
            }

            return array_values($row);
        });
    }

    private function isList(array $arr): bool
    {
        return $arr === [] || array_keys($arr) === range(0, count($arr) - 1);
    }
}
