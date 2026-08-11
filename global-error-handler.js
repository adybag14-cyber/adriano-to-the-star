/**
 * Global Error Boundary
 * Catches unhandled errors and promise rejections to provide user feedback
 */

window.addEventListener('error', (event) => {
    console.error('Global Error Caught:', event.error);
    if (window.notifications) {
        window.notifications.error(
            event.error?.message || 'An unexpected error occurred',
            'System Error'
        );
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
    if (window.notifications) {
        // Extract meaningful message from rejection
        const msg = event.reason?.message || event.reason || 'Async operation failed';
        window.notifications.error(
            typeof msg === 'string' ? msg : 'Unknown async error',
            'Async Error'
        );
    }
});
