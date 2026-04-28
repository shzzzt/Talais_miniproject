@extends('reports._layout')

@section('content')
    <table class="meta">
        <tr>
            <td>LRN: <strong>{{ $student->lrn }}</strong></td>
            <td>Name: <strong>{{ $student->last_name }}, {{ $student->first_name }} {{ $student->middle_name }}</strong></td>
        </tr>
        <tr>
            <td>Grade Level: <strong>{{ $enrollment->gradeLevel?->name }}</strong></td>
            <td>Section: <strong>{{ $enrollment->section?->name }}</strong></td>
        </tr>
        <tr>
            <td>School Year: <strong>{{ $enrollment->schoolYear?->label }}</strong></td>
            <td>Adviser: <strong>{{ $enrollment->section?->adviser?->name ?? '—' }}</strong></td>
        </tr>
    </table>

    <p class="strong">Learner&apos;s Progress Report</p>
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
            @forelse ($rows as $row)
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
            <tr>
                <td class="strong text-right" colspan="5">General Average</td>
                <td class="text-center strong {{ ($general >= 75) ? 'badge-pass' : 'badge-fail' }}">
                    {{ $general !== null ? number_format($general, 2) : '—' }}
                </td>
                <td class="text-center strong">{{ $general !== null ? ($general >= 75 ? 'Passed' : 'Failed') : '' }}</td>
            </tr>
        </tbody>
    </table>

    <p class="strong" style="margin-top: 8px;">Attendance Record</p>
    <table class="data">
        <thead>
            <tr>
                <th>Description</th>
                <th class="text-center">Q1</th>
                <th class="text-center">Q2</th>
                <th class="text-center">Q3</th>
                <th class="text-center">Q4</th>
                <th class="text-center">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach (['present' => 'Days Present', 'absent' => 'Days Absent', 'late' => 'Times Tardy'] as $key => $label)
                <tr>
                    <td>{{ $label }}</td>
                    @foreach (['Q1','Q2','Q3','Q4'] as $q)
                        <td class="text-center">{{ $attendance[$q][$key] ?? 0 }}</td>
                    @endforeach
                    <td class="text-center strong">{{ $attendance['total'][$key] ?? 0 }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="signature">
        <tr>
            <td style="width: 50%;">Class Adviser:<div class="line"></div>
                <div class="text-center small">{{ $enrollment->section?->adviser?->name }}</div>
            </td>
            <td style="width: 50%;">School Principal:<div class="line"></div>
                <div class="text-center small">{{ $school['principal'] ?? '' }}</div>
            </td>
        </tr>
    </table>
@endsection
