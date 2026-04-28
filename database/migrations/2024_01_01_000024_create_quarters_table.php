<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quarters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_year_id')->constrained('school_years')->onDelete('cascade');
            $table->string('name', 20);
            $table->tinyInteger('quarter_number');
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_grading_open')->default(false);
            $table->timestamps();

            $table->unique(['school_year_id', 'quarter_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quarters');
    }
};
