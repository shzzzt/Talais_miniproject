<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('parents', function (Blueprint $table) {
            $table->string('mother_tongue', 80)->nullable()->after('address');
            $table->string('ip_ethnic_group', 80)->nullable()->after('mother_tongue');
            $table->string('religion', 80)->nullable()->after('ip_ethnic_group');
            $table->string('house_street_sitio', 150)->nullable()->after('religion');
            $table->string('barangay', 80)->nullable()->after('house_street_sitio');
            $table->string('municipality_city', 80)->nullable()->after('barangay');
            $table->string('province', 80)->nullable()->after('municipality_city');
        });
    }

    public function down(): void
    {
        Schema::table('parents', function (Blueprint $table) {
            $table->dropColumn([
                'mother_tongue',
                'ip_ethnic_group',
                'religion',
                'house_street_sitio',
                'barangay',
                'municipality_city',
                'province',
            ]);
        });
    }
};
