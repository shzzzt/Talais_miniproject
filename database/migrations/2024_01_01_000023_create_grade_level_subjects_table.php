<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grade_level_subjects', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('grade_level_id');
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('cascade');
            $table->decimal('written_work_weight', 5, 2)->default(30.00);
            $table->decimal('performance_task_weight', 5, 2)->default(50.00);
            $table->decimal('quarterly_assessment_weight', 5, 2)->default(20.00);
            $table->timestamps();

            $table->foreign('grade_level_id')->references('id')->on('grade_levels')->onDelete('cascade');
            $table->unique(['grade_level_id', 'subject_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grade_level_subjects');
    }
};
