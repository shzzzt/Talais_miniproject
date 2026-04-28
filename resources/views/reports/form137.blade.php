@extends('reports._layout')

@section('content')
    <table class="meta">
        <tr>
            <td>LRN: <strong>{{ $student->lrn }}</strong></td>
            <td>Name: <strong>{{ $student->last_name }}, {{ $student->first_name }} {{ $student->middle_name }}</strong></td>
            <td>Sex: <strong>{{ ucfirst($student->gender) }}</strong></td>
        </tr>
        <tr>
            <td>Birth Date: <strong>{{ $student->birth_date?->format('M d, Y') }}</strong></td>
            <td>Birth Place: <strong>{{ $student->birth_place }}</strong></td>
            <td>Mother Tongue: <strong>{{ $student->mother_tongue }}</strong></td>
        </tr>
        <tr>
            <td colspan="3">Address: <strong>{{ trim(implode(', ', array_filter([$student->house_street_sitio, $student->barangay, $student->municipality_city, $student->province]))) }}</strong></td>
        </tr>
    </table>

    @forelse ($enrollments as $enrollment)
        <p class="strong" style="margin-top: 8px;">
            {{ $enrollment->gradeLevel?->name }} — S.Y. {{ $enrollment->schoolYear?->label }}
            @if ($enrollment->section) ({{ $enrollment->section->name }}) @endif
        </p>
        <table class="data">
            <thead>
                <tr>
                    <th>Subject</th>
                    <th class="text-center">Q1</th>
                    <th class="text-center">Q2</th>
                    <th class="text-center">Q3</th>
                    <th class="text-center">Q4</th>
                    <th class="text-center">Final</th>
                    <th class="text-center">Remarks</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($enrollment->grades_grouped as $row)
                    <tr>
                        <td>{{ $row['subject'] }}</td>
                        <td class="text-center">{{ $row['Q1'] ?? '—' }}</td>
                        <td class="text-center">{{ $row['Q2'] ?? '—' }}</td>
                        <td class="text-center">{{ $row['Q3'] ?? '—' }}</td>
                        <td class="text-center">{{ $row['Q4'] ?? '—' }}</td>
                        <td class="text-center {{ ($row['final'] ?? 0) >= 75 ? 'badge-pass' : 'badge-fail' }}">
                            {{ $row['final'] !== null ? number_format($row['final'], 1) : '—' }}
                        </td>
                        <td class="text-center">{{ $row['remarks'] ?? '' }}</td>
                    </tr>
                @empty
                    <tr><td colspan="7" class="text-center small">No grades recorded.</td></tr>
                @endforelse
            </tbody>
        </table>
    @empty
        <p class="small">No enrollment history found.</p>
    @endforelse
@endsection
