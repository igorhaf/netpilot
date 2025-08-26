<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RouteBinding extends Model
{
    use HasFactory;

    protected $fillable = [
        'route_rule_id','upstream_id','weight','sticky'
    ];

    protected $casts = [
        'sticky' => 'boolean',
    ];
}
