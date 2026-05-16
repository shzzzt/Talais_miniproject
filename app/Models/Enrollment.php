<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Enrollment extends Model
{
    use HasFactory;
    use LogsActivity;

    protected $fillable = [
        'student_id',
        'school_year_id',
        'grade_level_id',
        'section_id',
        'class_session',
        'enrollment_date',
        'enrollment_type',
        'status',
        'transfer_date',
        'transfer_destination',
        'transfer_quarter',
        'learning_modality',
        'is_summer_class',
        'qualifying_score',
        'enrolled_by',
    ];

    protected $casts = [
        'enrollment_date' => 'date',
        'transfer_date' => 'date',
        'is_summer_class' => 'boolean',
        'qualifying_score' => 'decimal:2',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logFillable()->logOnlyDirty();
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class);
    }

    public function gradeLevel(): BelongsTo
    {
        return $this->belongsTo(GradeLevel::class);
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    /**
     * For Kindergarten 1 / 2 (and other grades flagged with has_session), align AM/PM with the assigned section.
     */
    public function syncClassSessionFromSection(): void
    {
        if (! $this->section_id) {
            return;
        }

        $section = Section::with('gradeLevel')->find($this->section_id);
        if (! $section?->gradeLevel?->usesSessionScheduling()) {
            return;
        }

        if (in_array($section->session, ['AM', 'PM'], true)) {
            $this->class_session = $section->session;
        }
    }

    /**
     * @throws \Symfony\Component\HttpKernel\Exception\HttpException
     */
    public static function assertCompatibleSection(self $enrollment, ?int $sectionId): void
    {
        if ($sectionId === null) {
            return;
        }

        $section = Section::with('gradeLevel')->findOrFail($sectionId);

        abort_unless(
            (int) $section->school_year_id === (int) $enrollment->school_year_id,
            422,
            'Section must belong to the same school year as the enrollment.',
        );

        abort_unless(
            (int) $section->grade_level_id === (int) $enrollment->grade_level_id,
            422,
            'Section must match the enrollment grade level.',
        );

        $grade = GradeLevel::find($enrollment->grade_level_id);
        if ($grade?->usesSessionScheduling()) {
            abort_unless(
                in_array($section->session, ['AM', 'PM'], true),
                422,
                'Kindergarten 1 and Kindergarten 2 sections must use Morning (AM) or Afternoon (PM) schedule.',
            );

            if ($enrollment->class_session && $enrollment->class_session !== $section->session) {
                abort(422, 'The learner\'s class schedule (AM/PM) must match the section session.');
            }
        }
    }

    public function enrolledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'enrolled_by');
    }

    public function assessmentComponents(): HasMany
    {
        return $this->hasMany(AssessmentComponent::class);
    }

    public function grades(): HasMany
    {
        return $this->hasMany(StudentGrade::class);
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class);
    }
}
