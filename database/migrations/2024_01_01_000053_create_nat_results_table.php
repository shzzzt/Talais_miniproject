<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nat_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_year_id')->constrained('school_years')->onDelete('restrict');
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('restrict');
            $table->unsignedSmallInteger('grade_level_id');
            $table->decimal('mean_percentage_score', 5, 2);
            $table->smallInteger('number_of_takers');
            $table->string('proficiency_level', 50)->nullable();
            $table->text('remarks')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->foreign('grade_level_id')->references('id')->on('grade_levels')->onDelete('restrict');
            $table->unique(['school_year_id', 'subject_id', 'grade_level_id'], 'nat_unique_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nat_results');
    }
};
