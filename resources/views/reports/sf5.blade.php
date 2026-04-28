@extends('reports._layout')

@section('content')
    <table class="meta">
        <tr>
            <td>School Year: <strong>{{ $schoolYear?->label }}</strong></td>
            <td>Section: <strong>{{ $section?->name ?? 'All' }}</strong></td>
            <td>Grade Level: <strong>{{ $section?->gradeLevel?->name ?? '—' }}</strong></td>
        </tr>
    </table>

    <table class="data">
        <thead>
            <tr>
                <th>#</th>
                <th>LRN</th>
                <th>Student</th>
                <th class="text-center">General Average</th>
                <th>Action Taken</th>
                <th>Remarks</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($rows as $i => $row)
                <tr>
                    <td class="text-center">{{ $i + 1 }}</td>
                    <td>{{ $row['lrn'] }}</td>
                    <td>{{ $row['name'] }}</td>
                    <td class="text-center {{ ($row['general_average'] ?? 0) >= 75 ? 'badge-pass' : 'badge-fail' }}">
                        {{ number_format($row['general_average'] ?? 0, 2) }}
                    </td>
                    <td>{{ ($row['general_average'] ?? 0) >= 75 ? 'Promoted' : 'Retained' }}</td>
                    <td>{{ $row['remarks'] ?? '' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" class="text-center small">No completion data available.</td>
                </tr>
            @endforelse
        </tbody>
    </table>
@endsection
