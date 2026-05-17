<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            $table->dropForeign(['grade_level_id']);
            $table->dropColumn('grade_level_id');
        });
    }

    public function down(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            $table->unsignedSmallInteger('grade_level_id')->after('id');
            $table->foreign('grade_level_id')->references('id')->on('grade_levels')->onDelete('restrict');
        });
    }
};
