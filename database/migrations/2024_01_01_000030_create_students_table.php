<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('lrn', 12)->unique()->nullable();
            $table->string('first_name', 80);
            $table->string('middle_name', 80)->nullable();
            $table->string('last_name', 80);
            $table->string('suffix', 10)->nullable();
            $table->date('birth_date');
            $table->enum('gender', ['Male', 'Female']);
            $table->string('birth_place', 150)->nullable();
            $table->string('mother_tongue', 80)->nullable();
            $table->string('ip_ethnic_group', 80)->nullable();
            $table->string('religion', 80)->nullable();
            $table->string('house_street_sitio', 150)->nullable();
            $table->string('barangay', 80)->nullable();
            $table->string('municipality_city', 80)->nullable();
            $table->string('province', 80)->nullable();
            $table->string('birth_certificate_path')->nullable();
            $table->enum('status', ['enrolled', 'transferred_out', 'dropped', 'completed', 'alumni'])->default('enrolled');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['last_name', 'first_name']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
