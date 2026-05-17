<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')->where('role', 'grade_level_chair')->update(['role' => 'faculty']);

        $roleId = DB::table('roles')->where('name', 'grade_level_chair')->where('guard_name', 'web')->value('id');
        if ($roleId) {
            DB::table('model_has_roles')->where('role_id', $roleId)->delete();
            DB::table('role_has_permissions')->where('role_id', $roleId)->delete();
            DB::table('roles')->where('id', $roleId)->delete();
        }

        Schema::table('faculty', function (Blueprint $table) {
            $table->dropForeign(['grade_level_chair_of']);
            $table->dropColumn(['is_grade_level_chair', 'grade_level_chair_of']);
        });

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role::text = ANY (ARRAY['admin'::text, 'faculty'::text, 'parent'::text, 'school_admin'::text]))");
        } elseif ($driver === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'faculty', 'parent', 'school_admin') NOT NULL");
        }
    }

    public function down(): void
    {
        Schema::table('faculty', function (Blueprint $table) {
            $table->boolean('is_grade_level_chair')->default(false);
            $table->unsignedSmallInteger('grade_level_chair_of')->nullable();
            $table->foreign('grade_level_chair_of')->references('id')->on('grade_levels')->onDelete('set null');
        });

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role::text = ANY (ARRAY['admin'::text, 'faculty'::text, 'parent'::text, 'school_admin'::text, 'grade_level_chair'::text]))");
        } elseif ($driver === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'faculty', 'parent', 'school_admin', 'grade_level_chair') NOT NULL");
        }
    }
};
