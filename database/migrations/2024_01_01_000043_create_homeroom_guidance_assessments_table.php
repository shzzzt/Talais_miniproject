<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('homeroom_guidance_assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enrollment_id')->constrained('enrollments')->onDelete('cascade');
            $table->foreignId('quarter_id')->constrained('quarters')->onDelete('restrict');
            $table->string('competency', 200);
            $table->tinyInteger('rating');
            $table->foreignId('encoded_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->unique(['enrollment_id', 'quarter_id', 'competency'], 'hga_unique_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('homeroom_guidance_assessments');
    }
};
