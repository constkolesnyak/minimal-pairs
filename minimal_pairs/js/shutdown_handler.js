/**
 * Handles automatic server shutdown when browser window/tab is closed
 * Only shuts down on intentional quit, not on refresh
 */

let shutdownSent = false;
let intentionalQuit = false;

function sendShutdownRequest() {
    if (shutdownSent || !intentionalQuit) return;
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

// Function to mark that user wants to quit intentionally
function markIntentionalQuit() {
    intentionalQuit = true;
}

function initShutdownDetection() {
    // Only shutdown on beforeunload/unload if it's an intentional quit
    window.addEventListener('beforeunload', sendShutdownRequest);
    window.addEventListener('unload', sendShutdownRequest);
    
    // Export the function globally so it can be called by the quit shortcut
    window.markIntentionalQuit = markIntentionalQuit;
}


// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShutdownDetection);
} else {
    initShutdownDetection();
}
