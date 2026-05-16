<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sections', function (Blueprint $table) {
            $table->dropUnique(['school_year_id', 'grade_level_id', 'name']);
            $table->unique(['school_year_id', 'grade_level_id', 'name', 'session'], 'sections_year_grade_name_session_unique');
        });
    }

    public function down(): void
    {
        Schema::table('sections', function (Blueprint $table) {
            $table->dropUnique('sections_year_grade_name_session_unique');
            $table->unique(['school_year_id', 'grade_level_id', 'name']);
        });
    }
};
