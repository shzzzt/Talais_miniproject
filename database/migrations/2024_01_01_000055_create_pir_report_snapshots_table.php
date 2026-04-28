<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pir_report_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_year_id')->constrained('school_years')->onDelete('restrict');
            $table->foreignId('faculty_id')->constrained('faculty')->onDelete('cascade');
            $table->foreignId('section_id')->constrained('sections')->onDelete('cascade');
            $table->tinyInteger('report_month');
            $table->smallInteger('report_year');
            $table->unsignedTinyInteger('jan_enrolment_m')->default(0);
            $table->unsignedTinyInteger('jan_enrolment_f')->default(0);
            $table->unsignedTinyInteger('transferred_in_m')->default(0);
            $table->unsignedTinyInteger('transferred_in_f')->default(0);
            $table->string('transferred_in_reason', 255)->nullable();
            $table->unsignedTinyInteger('transferred_out_m')->default(0);
            $table->unsignedTinyInteger('transferred_out_f')->default(0);
            $table->string('transferred_out_reason', 255)->nullable();
            $table->unsignedTinyInteger('dropped_out_m')->default(0);
            $table->unsignedTinyInteger('dropped_out_f')->default(0);
            $table->string('dropped_out_reason', 255)->nullable();
            $table->unsignedTinyInteger('lardo_m')->default(0);
            $table->unsignedTinyInteger('lardo_f')->default(0);
            $table->string('lardo_reason', 255)->nullable();
            $table->unsignedTinyInteger('overage_m')->default(0);
            $table->unsignedTinyInteger('overage_f')->default(0);
            $table->unsignedTinyInteger('ip_learners_m')->default(0);
            $table->unsignedTinyInteger('ip_learners_f')->default(0);
            $table->unsignedTinyInteger('fourps_ctt_m')->default(0);
            $table->unsignedTinyInteger('fourps_ctt_f')->default(0);
            $table->unsignedTinyInteger('alive_learners_m')->default(0);
            $table->unsignedTinyInteger('alive_learners_f')->default(0);
            $table->foreignId('generated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['school_year_id', 'faculty_id', 'section_id', 'report_year', 'report_month'], 'pir_unique_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pir_report_snapshots');
    }
};
