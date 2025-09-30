#!/usr/bin/env python3
"""
Development server for minimal-pairs project with automatic port conflict resolution.
Prevents "Address already in use" errors by automatically handling port conflicts.
"""

import http.server
import socketserver
import socket
import subprocess
import sys
import time
import webbrowser
import signal
import os
from pathlib import Path


def check_port_in_use(port):
    """Check if a port is already in use."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(1)
        result = sock.connect_ex(('localhost', port))
        return result == 0


def kill_processes_on_port(port):
    """Kill any processes using the specified port."""
    try:
        # Find processes using the port
        result = subprocess.run(['lsof', '-ti', f':{port}'], 
                              capture_output=True, text=True)
        if result.returncode == 0 and result.stdout.strip():
            pids = result.stdout.strip().split('\n')
            print(f"Found processes on port {port}: {pids}")
            
            # Try graceful kill first
            for pid in pids:
                try:
                    subprocess.run(['kill', pid], check=False)
                    print(f"Killed process {pid}")
                except subprocess.CalledProcessError:
                    pass
            
            # Wait a moment
            time.sleep(2)
            
            # Force kill if still running
            if check_port_in_use(port):
                print(f"Force killing processes on port {port}")
                for pid in pids:
                    try:
                        subprocess.run(['kill', '-9', pid], check=False)
                    except subprocess.CalledProcessError:
                        pass
                time.sleep(1)
                
    except subprocess.CalledProcessError:
        # lsof might not find anything, which is fine
        pass


def find_available_port(start_port=8000, max_attempts=100):
    """Find an available port starting from start_port."""
    for port in range(start_port, start_port + max_attempts):
        if not check_port_in_use(port):
            return port
    raise RuntimeError(f"Could not find available port in range {start_port}-{start_port + max_attempts}")


def create_server(port):
    """Create and configure the HTTP server."""
    class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(Path.cwd()), **kwargs)
        
        def log_message(self, format, *args):
            # Custom logging format
            print(f"{self.address_string()} - {format % args}")
    
    try:
        server = socketserver.TCPServer(("localhost", port), CustomHTTPRequestHandler)
        server.allow_reuse_address = True
        return server
    except OSError as e:
        if e.errno == 48:  # Address already in use
            return None
        raise


def main():
    """Main server startup logic."""
    default_port = 8000
    
    print("Starting minimal-pairs development server...")
    print(f"Working directory: {Path.cwd()}")
    
    # Check if index.html exists
    if not Path("index.html").exists():
        print("Warning: index.html not found in current directory")
        print("Make sure you're running this from the project root directory")
    
    # First, try to clean up any existing processes on default port
    if check_port_in_use(default_port):
        print(f"Port {default_port} is in use, attempting to free it...")
        kill_processes_on_port(default_port)
    
    # Find an available port
    try:
        port = find_available_port(default_port)
    except RuntimeError as e:
        print(f"Error: {e}")
        sys.exit(1)
    
    if port != default_port:
        print(f"Default port {default_port} unavailable, using port {port}")
    
    # Create server
    server = create_server(port)
    if server is None:
        print(f"Failed to create server on port {port}")
        # Try one more time with a different port
        port = find_available_port(port + 1)
        print(f"Trying alternative port {port}")
        server = create_server(port)
        if server is None:
            print("Failed to create server")
            sys.exit(1)
    
    # Set up signal handler for graceful shutdown
    def signal_handler(sig, frame):
        print("\nShutting down server...")
        try:
            server.shutdown()
            server.server_close()
        except Exception as e:
            print(f"Error during shutdown: {e}")
        finally:
            print("Server stopped")
            os._exit(0)  # Force exit to prevent hanging
    
    # Register signal handlers before starting server
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Also handle SIGQUIT (Ctrl+\) as backup
    if hasattr(signal, 'SIGQUIT'):
        signal.signal(signal.SIGQUIT, signal_handler)
    
    # Start server
    print(f"Server starting on http://localhost:{port}")
    
    # Open browser after a short delay
    def open_browser():
        time.sleep(1)
        webbrowser.open(f"http://localhost:{port}")
    
    import threading
    browser_thread = threading.Thread(target=open_browser)
    browser_thread.daemon = True
    browser_thread.start()
    
    try:
        print("Press Ctrl+C to stop the server (or Ctrl+\\ if Ctrl+C doesn't work)")
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer interrupted by KeyboardInterrupt")
        signal_handler(signal.SIGINT, None)
    except Exception as e:
        print(f"\nServer error: {e}")
    finally:
        try:
            server.server_close()
            print("Server stopped")
        except:
            pass


if __name__ == "__main__":
    main()