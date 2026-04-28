<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grade_levels', function (Blueprint $table) {
            $table->smallIncrements('id');
            $table->string('name', 30)->unique();
            $table->tinyInteger('level_order');
            $table->boolean('is_departmentalized')->default(false);
            $table->boolean('has_session')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grade_levels');
    }
};
