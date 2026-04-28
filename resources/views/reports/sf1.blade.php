@extends('reports._layout')

@section('content')
    <table class="meta">
        <tr>
            <td>School Year: <strong>{{ $schoolYear?->label }}</strong></td>
            <td>Grade Level: <strong>{{ $section?->gradeLevel?->name ?? '—' }}</strong></td>
            <td>Section: <strong>{{ $section?->name ?? 'All Sections' }}</strong></td>
            <td>Adviser: <strong>{{ $section?->adviser?->name ?? '—' }}</strong></td>
        </tr>
    </table>

    <table class="data">
        <thead>
            <tr>
                <th style="width: 30px;">#</th>
                <th>LRN</th>
                <th>Last Name</th>
                <th>First Name</th>
                <th>Middle Name</th>
                <th>Sex</th>
                <th>Birth Date</th>
                <th>Age</th>
                <th>Mother Tongue</th>
                <th>IP/Ethnic Group</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($enrollments as $i => $enrollment)
                @php $student = $enrollment->student; @endphp
                <tr>
                    <td class="text-center">{{ $i + 1 }}</td>
                    <td>{{ $student->lrn }}</td>
                    <td>{{ $student->last_name }}</td>
                    <td>{{ $student->first_name }}</td>
                    <td>{{ $student->middle_name }}</td>
                    <td class="text-center">{{ strtoupper(substr($student->gender ?? '', 0, 1)) }}</td>
                    <td>{{ $student->birth_date?->format('M d, Y') }}</td>
                    <td class="text-center">{{ $student->age }}</td>
                    <td>{{ $student->mother_tongue }}</td>
                    <td>{{ $student->ip_ethnic_group }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="10" class="text-center small">No enrollments recorded.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <table class="signature">
        <tr>
            <td style="width: 50%;">
                Prepared by:
                <div class="line"></div>
                <div class="text-center small">{{ $section?->adviser?->name ?? 'Class Adviser' }}</div>
            </td>
            <td style="width: 50%;">
                Approved by:
                <div class="line"></div>
                <div class="text-center small">{{ $school['principal'] ?? 'School Principal' }}</div>
            </td>
        </tr>
    </table>
@endsection
