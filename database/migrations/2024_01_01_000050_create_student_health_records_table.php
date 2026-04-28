<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_health_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('school_year_id')->constrained('school_years')->onDelete('restrict');
            $table->date('measurement_date');
            $table->decimal('weight_kg', 5, 2);
            $table->decimal('height_cm', 5, 2);
            $table->decimal('bmi', 5, 2)->nullable();
            $table->enum('bmi_classification', ['severely_wasted', 'wasted', 'normal', 'overweight', 'obese'])->nullable();
            $table->boolean('is_feeding_program')->default(false);
            $table->text('other_notes')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->unique(['student_id', 'school_year_id', 'measurement_date'], 'health_unique_idx');
            $table->index(['school_year_id', 'is_feeding_program']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_health_records');
    }
};
