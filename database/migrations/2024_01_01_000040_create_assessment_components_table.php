<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assessment_components', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enrollment_id')->constrained('enrollments')->onDelete('cascade');
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('restrict');
            $table->foreignId('quarter_id')->constrained('quarters')->onDelete('restrict');
            $table->enum('component_type', ['written_work', 'performance_task', 'quarterly_assessment']);
            $table->tinyInteger('item_number');
            $table->decimal('score', 6, 2);
            $table->decimal('highest_possible_score', 6, 2);
            $table->foreignId('encoded_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->unique(['enrollment_id', 'subject_id', 'quarter_id', 'component_type', 'item_number'], 'assessment_unique_idx');
            $table->index(['enrollment_id', 'subject_id', 'quarter_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assessment_components');
    }
};
