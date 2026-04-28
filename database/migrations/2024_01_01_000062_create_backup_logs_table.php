<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('backup_logs', function (Blueprint $table) {
            $table->id();
            $table->enum('backup_type', ['database', 'files', 'full'])->default('database');
            $table->enum('triggered_by', ['scheduled', 'manual'])->default('manual');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->enum('status', ['success', 'failed'])->default('success');
            $table->string('file_path', 500)->nullable();
            $table->decimal('file_size_mb', 10, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('backup_logs');
    }
};
