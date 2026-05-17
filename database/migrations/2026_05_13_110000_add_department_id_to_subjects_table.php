<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('subjects', 'department_id')) {
            return;
        }

        Schema::table('subjects', function (Blueprint $table) {
            $table->foreignId('department_id')->nullable()->constrained('departments')->onDelete('set null');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('subjects', 'department_id')) {
            return;
        }

        Schema::table('subjects', function (Blueprint $table) {
            $table->dropConstrainedForeignId('department_id');
        });
    }
};
