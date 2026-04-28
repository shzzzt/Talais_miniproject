<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('key_performance_indicators', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_year_id')->constrained('school_years')->onDelete('restrict');
            $table->string('indicator_name', 100);
            $table->decimal('value', 8, 4);
            $table->text('formula_used')->nullable();
            $table->unsignedSmallInteger('grade_level_id')->nullable();
            $table->timestamp('computed_at')->nullable();
            $table->foreignId('computed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->foreign('grade_level_id')->references('id')->on('grade_levels')->onDelete('cascade');
            $table->index(['school_year_id', 'indicator_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('key_performance_indicators');
    }
};
