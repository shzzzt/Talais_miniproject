import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { router, usePage } from '@inertiajs/react';

/**
 * Inertia-backed auth context that preserves the old `useAuth()` API
 * surface used throughout the TALAIS UI. Authentication state is read
 * from Inertia shared props rather than the legacy `base44` SDK.
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const { props } = usePage();
    const sharedAuth = props?.auth ?? {};
    const user = sharedAuth.user ?? null;

    const value = useMemo(() => {
        const logout = (shouldRedirect = true) => {
            router.post(
                '/logout',
                {},
                {
                    onFinish: () => {
                        if (shouldRedirect) {
                            window.location.href = '/login';
                        }
                    },
                },
            );
        };

        const navigateToLogin = () => {
            window.location.href = '/login';
        };

        return {
            user,
            isAuthenticated: !!user,
            isLoadingAuth: false,
            isLoadingPublicSettings: false,
            authError: null,
            authChecked: true,
            appPublicSettings: props?.app ?? null,
            permissions: sharedAuth.permissions ?? [],
            unreadCount: sharedAuth.unread_notifications_count ?? 0,
            recentNotifications: sharedAuth.recent_notifications ?? [],
            logout,
            navigateToLogin,
            checkAppState: () => {},
            checkUserAuth: () => {},
            hasRole: (role) => user?.role === role,
            hasAnyRole: (roles) => roles.includes(user?.role),
            hasPermission: (perm) => (sharedAuth.permissions ?? []).includes(perm),
        };
    }, [user, sharedAuth, props?.app]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return ctx;
}
