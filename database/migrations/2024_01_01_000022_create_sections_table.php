<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_year_id')->constrained('school_years')->onDelete('restrict');
            $table->unsignedSmallInteger('grade_level_id');
            $table->string('name', 50);
            $table->enum('type', ['cream', 'regular'])->default('regular');
            $table->enum('session', ['AM', 'PM', 'whole_day'])->default('whole_day');
            $table->foreignId('adviser_id')->nullable()->constrained('users')->onDelete('set null');
            $table->unsignedTinyInteger('max_capacity')->default(40);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('grade_level_id')->references('id')->on('grade_levels')->onDelete('restrict');
            $table->unique(['school_year_id', 'grade_level_id', 'name']);
            $table->index(['school_year_id', 'grade_level_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sections');
    }
};
