<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grade_review_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_year_id')->constrained('school_years')->onDelete('cascade');
            $table->foreignId('assigned_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('reviewer_faculty_id')->constrained('faculty')->onDelete('cascade');
            $table->foreignId('reviewee_faculty_id')->constrained('faculty')->onDelete('cascade');
            $table->foreignId('section_id')->nullable()->constrained('sections')->onDelete('set null');
            $table->foreignId('quarter_id')->nullable()->constrained('quarters')->onDelete('set null');
            $table->enum('status', ['pending', 'in_review', 'completed'])->default('pending');
            $table->timestamp('reviewed_at')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->index(['school_year_id', 'status']);
            $table->index(['reviewer_faculty_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grade_review_assignments');
    }
};
