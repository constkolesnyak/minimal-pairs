#!/usr/bin/env python3
"""
Main entry point for minimal-pairs development server.
Bulletproof signal handling ensures Ctrl+C always works.
"""

import http.server
import socketserver
import signal
import sys
import os
import threading
import time
import webbrowser
from pathlib import Path


class GracefulHTTPServer(socketserver.TCPServer):
    """HTTP server that handles shutdown gracefully."""
    
    def __init__(self, server_address, RequestHandlerClass, bind_and_activate=True):
        self.allow_reuse_address = True
        self._shutdown_requested = False
        super().__init__(server_address, RequestHandlerClass, bind_and_activate)
    
    def shutdown_request(self, request):
        """Called to shutdown and close an individual request."""
        try:
            super().shutdown_request(request)
        except Exception:
            # Ignore errors during shutdown
            pass
    
    def server_close(self):
        """Called to clean-up the server."""
        try:
            super().server_close()
        except Exception:
            # Ignore errors during cleanup
            pass


class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom request handler with minimal logging."""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(Path.cwd()), **kwargs)
    
    def log_message(self, format, *args):
        """Override to provide cleaner logging."""
        print(f"{self.address_string()} - {format % args}")
    
    def end_headers(self):
        """Add CORS headers for development."""
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()


# Global server instance
server = None
shutdown_event = threading.Event()


def force_shutdown():
    """Force shutdown if graceful shutdown fails."""
    print("Force shutdown initiated...")
    os._exit(0)


def signal_handler(signum, frame):
    """Handle shutdown signals with force backup."""
    global server
    
    print(f"\nReceived signal {signum} - Shutting down server...")
    
    # Set shutdown event
    shutdown_event.set()
    
    # Start force shutdown timer (backup plan)
    force_timer = threading.Timer(3.0, force_shutdown)
    force_timer.daemon = True
    force_timer.start()
    
    try:
        if server:
            # Shutdown server in separate thread to avoid blocking
            def shutdown_server():
                try:
                    server.shutdown()
                    server.server_close()
                    print("Server shutdown complete")
                except Exception as e:
                    print(f"Error during server shutdown: {e}")
                finally:
                    # Cancel force shutdown since we completed gracefully
                    force_timer.cancel()
                    os._exit(0)
            
            shutdown_thread = threading.Thread(target=shutdown_server)
            shutdown_thread.daemon = True
            shutdown_thread.start()
            
            # Wait a moment for graceful shutdown
            shutdown_thread.join(timeout=2.0)
            
    except Exception as e:
        print(f"Error in signal handler: {e}")
    
    # If we get here, force exit
    print("Forcing exit...")
    os._exit(0)


def setup_signal_handlers():
    """Set up all possible signal handlers for shutdown."""
    # Standard signals
    signal.signal(signal.SIGINT, signal_handler)   # Ctrl+C
    signal.signal(signal.SIGTERM, signal_handler)  # Termination
    
    # Additional signals on Unix systems
    if hasattr(signal, 'SIGHUP'):
        signal.signal(signal.SIGHUP, signal_handler)   # Hangup
    
    # Ignore broken pipe (helps with client disconnections)
    if hasattr(signal, 'SIGPIPE'):
        signal.signal(signal.SIGPIPE, signal.SIG_IGN)


def find_available_port(start_port=8000, max_attempts=50):
    """Find an available port."""
    import socket
    
    for port in range(start_port, start_port + max_attempts):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.bind(('localhost', port))
                return port
        except OSError:
            continue
    
    raise RuntimeError(f"No available ports in range {start_port}-{start_port + max_attempts}")


def open_browser_delayed(url, delay=1.0):
    """Open browser after a delay."""
    def open_browser():
        time.sleep(delay)
        if not shutdown_event.is_set():
            try:
                webbrowser.open(url)
            except Exception:
                # Ignore browser opening errors
                pass
    
    browser_thread = threading.Thread(target=open_browser)
    browser_thread.daemon = True
    browser_thread.start()


def main():
    """Main server function."""
    global server
    
    print("Starting minimal-pairs development server...")
    
    # Setup signal handlers FIRST
    setup_signal_handlers()
    
    # Check if we're in the right directory
    if not Path("index.html").exists():
        print("Warning: index.html not found in current directory")
        print(f"Current directory: {Path.cwd()}")
        print("Make sure you're running this from the project root")
    
    # Find available port
    try:
        port = find_available_port()
    except RuntimeError as e:
        print(f"Error: {e}")
        sys.exit(1)
    
    # Create server
    try:
        server = GracefulHTTPServer(("localhost", port), CustomHTTPRequestHandler)
        print(f"Server starting on http://localhost:{port}")
        print("Press Ctrl+C to stop")
        
        # Open browser
        open_browser_delayed(f"http://localhost:{port}")
        
        # Serve forever with proper exception handling
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            # This should be caught by signal handler, but just in case
            print("\nKeyboard interrupt received")
            signal_handler(signal.SIGINT, None)
        except Exception as e:
            print(f"\nServer error: {e}")
            
    except OSError as e:
        print(f"Failed to start server: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)
    finally:
        # Final cleanup
        if server:
            try:
                server.server_close()
            except:
                pass
        print("Server stopped")


if __name__ == "__main__":
    main()