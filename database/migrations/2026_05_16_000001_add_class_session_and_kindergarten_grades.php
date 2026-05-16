<?php

use App\Models\GradeLevel;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->enum('class_session', ['AM', 'PM'])->nullable()->after('section_id');
        });

        if (GradeLevel::where('name', 'Kindergarten 1')->exists()) {
            GradeLevel::where('name', 'Kindergarten')->update(['has_session' => false]);

            return;
        }

        GradeLevel::query()->increment('level_order', 2);

        GradeLevel::firstOrCreate(
            ['name' => 'Kindergarten 1'],
            [
                'level_order' => 0,
                'is_departmentalized' => false,
                'has_session' => true,
            ],
        );

        GradeLevel::firstOrCreate(
            ['name' => 'Kindergarten 2'],
            [
                'level_order' => 1,
                'is_departmentalized' => false,
                'has_session' => true,
            ],
        );

        GradeLevel::where('name', 'Kindergarten')->update(['has_session' => false]);
    }

    public function down(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropColumn('class_session');
        });

        GradeLevel::whereIn('name', ['Kindergarten 1', 'Kindergarten 2'])->delete();
        GradeLevel::query()->decrement('level_order', 2);
        GradeLevel::where('name', 'Kindergarten')->update(['has_session' => true]);
    }
};
