@extends('reports._layout')

@section('content')
    <div style="margin-top: 28px; font-size: 10pt; line-height: 1.8;">
        <p>To whom it may concern:</p>

        <p style="text-align: justify;">
            This is to certify that <strong>{{ $student->full_name }}</strong>,
            @if($student->lrn)
                with Learner Reference Number <strong>{{ $student->lrn }}</strong>,
            @endif
            is a learner of <strong>{{ $school['name'] ?? 'Musuan Integrated School' }}</strong>
            @if($enrollment)
                enrolled in <strong>{{ $enrollment->gradeLevel?->name ?? '—' }}</strong>
                @if($enrollment->section)
                    , Section <strong>{{ $enrollment->section->name }}</strong>,
                @endif
                for School Year <strong>{{ $enrollment->schoolYear?->label ?? '—' }}</strong>
            @endif
            .
        </p>

        <p style="text-align: justify;">
            Based on the records available in this school, the learner has no unresolved major
            disciplinary case on file as of the date this certificate is issued.
        </p>

        <p style="text-align: justify;">
            This certification is issued upon the request of the parent/guardian for school
            transfer and other legitimate educational purposes.
        </p>

        <p>Issued this {{ $issuedAt->format('jS') }} day of {{ $issuedAt->format('F Y') }}.</p>
    </div>

    <table class="signature" style="margin-top: 52px;">
        <tr>
            <td style="width: 50%;"></td>
            <td style="width: 50%;">
                <div class="line"></div>
                <div class="text-center strong">{{ $school['principal'] ?? '' }}</div>
                <div class="text-center small">School Principal</div>
            </td>
        </tr>
    </table>
@endsection
