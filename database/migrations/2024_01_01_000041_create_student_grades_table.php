<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enrollment_id')->constrained('enrollments')->onDelete('cascade');
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('restrict');
            $table->foreignId('quarter_id')->nullable()->constrained('quarters')->onDelete('restrict');
            $table->decimal('written_work_ps', 5, 2)->nullable();
            $table->decimal('performance_task_ps', 5, 2)->nullable();
            $table->decimal('quarterly_assessment_ps', 5, 2)->nullable();
            $table->decimal('quarterly_grade', 5, 2)->nullable();
            $table->decimal('final_grade', 5, 2)->nullable();
            $table->enum('remarks', ['Passed', 'Failed', 'Dropped'])->nullable();
            $table->boolean('is_locked')->default(false);
            $table->foreignId('validated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('validated_at')->nullable();
            $table->foreignId('encoded_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->unique(['enrollment_id', 'subject_id', 'quarter_id'], 'student_grades_unique_idx');
            $table->index(['enrollment_id', 'subject_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_grades');
    }
};
