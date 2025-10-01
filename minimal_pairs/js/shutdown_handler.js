/**
 * Handles automatic server shutdown when browser window/tab is closed
 */

let shutdownSent = false;

function sendShutdownRequest() {
    if (shutdownSent) return;
    shutdownSent = true;

    // Use sendBeacon for reliable shutdown during page unload
    if (navigator.sendBeacon) {
        navigator.sendBeacon('/shutdown', JSON.stringify({}));
    } else {
        // Fallback for older browsers
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/shutdown', false);
        xhr.setRequestHeader('Content-Type', 'application/json');
        try {
            xhr.send(JSON.stringify({}));
        } catch (e) {
            // Ignore errors
        }
    }
}

function initShutdownDetection() {
    window.addEventListener('beforeunload', sendShutdownRequest);
    window.addEventListener('unload', sendShutdownRequest);
}


// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShutdownDetection);
} else {
    initShutdownDetection();
}
