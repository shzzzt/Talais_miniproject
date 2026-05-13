<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('faculty', 'department_id')) {
            return;
        }

        Schema::table('faculty', function (Blueprint $table) {
            $table->foreignId('department_id')->nullable()->constrained('departments')->onDelete('set null');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('faculty', 'department_id')) {
            return;
        }

        Schema::table('faculty', function (Blueprint $table) {
            $table->dropConstrainedForeignId('department_id');
        });
    }
};
