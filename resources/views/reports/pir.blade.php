@extends('reports._layout')

@section('content')
    <table class="meta">
        <tr>
            <td>School Year: <strong>{{ $schoolYear?->label }}</strong></td>
            <td>Generated: <strong>{{ now()->format('M d, Y') }}</strong></td>
        </tr>
    </table>

    <p class="strong">Enrollment Snapshot</p>
    <table class="data">
        <thead>
            <tr>
                <th>Indicator</th>
                <th class="text-center">Value</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($indicators as $row)
                <tr>
                    <td>{{ $row['label'] }}</td>
                    <td class="text-center strong">{{ $row['value'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <p class="strong" style="margin-top: 8px;">Promotion / Retention</p>
    <table class="data">
        <thead>
            <tr>
                <th>Grade Level</th>
                <th class="text-center">Enrolled</th>
                <th class="text-center">Promoted</th>
                <th class="text-center">Retained</th>
                <th class="text-center">Promotion Rate</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($promotion as $row)
                <tr>
                    <td>{{ $row['grade_level'] }}</td>
                    <td class="text-center">{{ $row['enrolled'] }}</td>
                    <td class="text-center">{{ $row['promoted'] }}</td>
                    <td class="text-center">{{ $row['retained'] }}</td>
                    <td class="text-center">{{ $row['rate'] }}%</td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endsection
