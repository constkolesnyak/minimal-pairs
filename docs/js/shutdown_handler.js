/**
 * Handles automatic server shutdown when browser window/tab is closed.
 * The shutdown endpoint only exists when the app runs via the local
 * FastAPI server, so we short-circuit when served from static hosting.
 */

const shutdownHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
const shutdownPath = '/shutdown';

let shutdownSent = false;
let intentionalQuit = false;

function hasShutdownEndpoint() {
    return shutdownHosts.has(window.location.hostname);
}

function sendShutdownRequest() {
    if (!hasShutdownEndpoint() || shutdownSent || !intentionalQuit) {
        return;
    }

    shutdownSent = true;

    // Use sendBeacon for reliable shutdown during page unload
    if (navigator.sendBeacon) {
        navigator.sendBeacon(shutdownPath, JSON.stringify({}));
        return;
    }

    // Fallback for older browsers when sendBeacon isn't available
    const xhr = new XMLHttpRequest();
    xhr.open('POST', shutdownPath, false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    try {
        xhr.send(JSON.stringify({}));
    } catch (e) {
        // Ignore errors
    }
}

// Function to mark that user wants to quit intentionally
function markIntentionalQuit() {
    intentionalQuit = true;
}

function initShutdownDetection() {
    if (!hasShutdownEndpoint()) {
        window.markIntentionalQuit = () => {};
        return;
    }

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
