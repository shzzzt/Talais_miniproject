@extends('reports._layout')

@section('content')
    <table class="meta">
        <tr>
            <td>School Year: <strong>{{ $schoolYear?->label }}</strong></td>
            <td>Grade Level: <strong>{{ $section?->gradeLevel?->name ?? '—' }}</strong></td>
            <td>Section: <strong>{{ $section?->name ?? '—' }}</strong></td>
            <td>Period: <strong>{{ $from?->format('M d, Y') }} – {{ $to?->format('M d, Y') }}</strong></td>
        </tr>
    </table>

    <table class="data">
        <thead>
            <tr>
                <th style="width: 30px;">#</th>
                <th>LRN</th>
                <th>Student</th>
                <th class="text-center">Days Present</th>
                <th class="text-center">Absent</th>
                <th class="text-center">Late</th>
                <th class="text-center">Excused</th>
                <th class="text-center">Total Days</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($rows as $i => $row)
                <tr>
                    <td class="text-center">{{ $i + 1 }}</td>
                    <td>{{ $row['lrn'] }}</td>
                    <td>{{ $row['name'] }}</td>
                    <td class="text-center">{{ $row['present'] }}</td>
                    <td class="text-center {{ $row['absent'] >= 5 ? 'badge-fail' : '' }}">{{ $row['absent'] }}</td>
                    <td class="text-center">{{ $row['late'] }}</td>
                    <td class="text-center">{{ $row['excused'] }}</td>
                    <td class="text-center">{{ $row['total'] }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="8" class="text-center small">No attendance recorded.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <table class="signature">
        <tr>
            <td style="width: 50%;">Prepared by:<div class="line"></div></td>
            <td style="width: 50%;">Noted by:<div class="line"></div></td>
        </tr>
    </table>
@endsection
