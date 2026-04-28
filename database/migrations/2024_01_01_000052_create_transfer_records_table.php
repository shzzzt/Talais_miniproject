<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transfer_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('school_year_id')->constrained('school_years')->onDelete('restrict');
            $table->string('transfer_type', 30);
            $table->date('transfer_date');
            $table->tinyInteger('quarter_at_transfer')->nullable();
            $table->foreignId('from_section_id')->nullable()->constrained('sections')->onDelete('set null');
            $table->foreignId('to_section_id')->nullable()->constrained('sections')->onDelete('set null');
            $table->string('from_school', 200)->nullable();
            $table->string('to_school', 200)->nullable();
            $table->text('reason')->nullable();
            $table->jsonb('documents_received')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index(['school_year_id', 'transfer_type']);
            $table->index('student_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transfer_records');
    }
};
