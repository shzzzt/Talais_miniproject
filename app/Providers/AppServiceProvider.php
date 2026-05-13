<?php

namespace App\Providers;

use App\Models\User;
use App\Services\Sms\SemaphoreSmsGateway;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Spatie\Permission\Models\Role;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(SemaphoreSmsGateway::class, fn () => SemaphoreSmsGateway::fromConfig());
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        Event::listen(Login::class, function (Login $event): void {
            $user = $event->user;
            if (! $user instanceof User || ! filled($user->role)) {
                return;
            }

            Role::findOrCreate($user->role, 'web');
            if (! $user->hasRole($user->role)) {
                $user->syncRoles([$user->role]);
            }
        });
    }
}
