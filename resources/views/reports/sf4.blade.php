@extends('reports._layout')

@section('content')
    <table class="meta">
        <tr>
            <td>School Year: <strong>{{ $schoolYear?->label }}</strong></td>
            <td>Period: <strong>{{ $month }}</strong></td>
        </tr>
    </table>

    <table class="data">
        <thead>
            <tr>
                <th>Grade Level</th>
                <th class="text-center">Male</th>
                <th class="text-center">Female</th>
                <th class="text-center">Total Enrolled</th>
                <th class="text-center">Transfer In</th>
                <th class="text-center">Transfer Out</th>
                <th class="text-center">Dropouts</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($rows as $row)
                <tr>
                    <td>{{ $row['grade_level'] }}</td>
                    <td class="text-center">{{ $row['male'] }}</td>
                    <td class="text-center">{{ $row['female'] }}</td>
                    <td class="text-center strong">{{ $row['total'] }}</td>
                    <td class="text-center">{{ $row['transfer_in'] }}</td>
                    <td class="text-center">{{ $row['transfer_out'] }}</td>
                    <td class="text-center">{{ $row['dropouts'] }}</td>
                </tr>
            @endforeach
            <tr>
                <td class="strong">Total</td>
                <td class="text-center strong">{{ $totals['male'] }}</td>
                <td class="text-center strong">{{ $totals['female'] }}</td>
                <td class="text-center strong">{{ $totals['total'] }}</td>
                <td class="text-center">{{ $totals['transfer_in'] }}</td>
                <td class="text-center">{{ $totals['transfer_out'] }}</td>
                <td class="text-center">{{ $totals['dropouts'] }}</td>
            </tr>
        </tbody>
    </table>
@endsection
