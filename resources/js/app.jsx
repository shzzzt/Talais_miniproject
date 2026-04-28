import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { AuthProvider } from '@/lib/AuthContext';
import { SchoolSettingsProvider } from '@/lib/SchoolSettingsContext';
import { Toaster } from '@/components/ui/toaster';

const appName = import.meta.env.VITE_APP_NAME || 'TALAIS';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <QueryClientProvider client={queryClientInstance}>
                <App {...props}>
                    {({ Component, props: pageProps, key }) => {
                        const child = <Component key={key} {...pageProps} />;
                        const layout = Component.layout
                            ? Component.layout(child)
                            : child;
                        return (
                            <AuthProvider>
                                <SchoolSettingsProvider>
                                    {layout}
                                    <Toaster />
                                </SchoolSettingsProvider>
                            </AuthProvider>
                        );
                    }}
                </App>
            </QueryClientProvider>,
        );
    },
    progress: {
        color: '#1e3a5f',
    },
});
