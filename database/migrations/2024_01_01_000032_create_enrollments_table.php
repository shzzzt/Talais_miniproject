<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('restrict');
            $table->foreignId('school_year_id')->constrained('school_years')->onDelete('restrict');
            $table->unsignedSmallInteger('grade_level_id');
            $table->foreignId('section_id')->nullable()->constrained('sections')->onDelete('set null');
            $table->date('enrollment_date');
            $table->enum('enrollment_type', ['new', 'continuing', 'transfer_in'])->default('new');
            $table->enum('status', ['enrolled', 'dropped', 'transferred_out', 'completed', 'pending'])->default('enrolled');
            $table->date('transfer_date')->nullable();
            $table->string('transfer_destination', 200)->nullable();
            $table->tinyInteger('transfer_quarter')->nullable();
            $table->enum('learning_modality', ['Face to Face', 'Modular (print)', 'Blended', 'Online'])->default('Face to Face');
            $table->boolean('is_summer_class')->default(false);
            $table->decimal('qualifying_score', 5, 2)->nullable();
            $table->foreignId('enrolled_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->foreign('grade_level_id')->references('id')->on('grade_levels')->onDelete('restrict');
            $table->unique(['student_id', 'school_year_id']);
            $table->index(['school_year_id', 'grade_level_id']);
            $table->index(['school_year_id', 'section_id']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enrollments');
    }
};
