<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sf3_book_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enrollment_id')->constrained('enrollments')->onDelete('cascade');
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('restrict');
            $table->string('book_title', 200);
            $table->date('issued_date');
            $table->date('returned_date')->nullable();
            $table->enum('condition_on_issue', ['new', 'good', 'fair', 'poor'])->default('good');
            $table->enum('condition_on_return', ['good', 'fair', 'poor', 'lost'])->nullable();
            $table->string('remarks', 255)->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index('enrollment_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sf3_book_records');
    }
};
