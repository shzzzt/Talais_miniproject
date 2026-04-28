<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BackupLog extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'backup_type',
        'triggered_by',
        'user_id',
        'status',
        'file_path',
        'file_size_mb',
        'notes',
        'created_at',
    ];

    protected $casts = [
        'file_size_mb' => 'decimal:2',
        'created_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
