<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('faculty', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('employee_id', 30)->unique()->nullable();
            $table->string('first_name', 80);
            $table->string('middle_name', 80)->nullable();
            $table->string('last_name', 80);
            $table->enum('position', ['teacher_1', 'teacher_2', 'teacher_3', 'master_teacher_1', 'master_teacher_2'])->nullable();
            $table->string('specialization', 100)->nullable();
            $table->boolean('is_grade_level_chair')->default(false);
            $table->unsignedSmallInteger('grade_level_chair_of')->nullable();
            $table->boolean('is_grade_level_head')->default(false);
            $table->unsignedSmallInteger('grade_level_head_of')->nullable();
            $table->string('contact_number', 20)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('grade_level_chair_of')->references('id')->on('grade_levels')->onDelete('set null');
            $table->foreign('grade_level_head_of')->references('id')->on('grade_levels')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('faculty');
    }
};
