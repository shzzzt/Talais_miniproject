<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('grade_level_id');
            $table->string('name', 120);
            $table->timestamps();

            $table->foreign('grade_level_id')->references('id')->on('grade_levels')->onDelete('restrict');
        });

        Schema::create('department_subject_teacher', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained('departments')->onDelete('cascade');
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('cascade');
            $table->foreignId('faculty_id')->nullable()->constrained('faculty')->onDelete('set null');
            $table->timestamps();

            $table->unique(['department_id', 'subject_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('department_subject_teacher');
        Schema::dropIfExists('departments');
    }
};
