import os
import signal
import socket
import threading
import time
import webbrowser

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

package_dir = os.path.dirname(os.path.abspath(__file__))
app = FastAPI()

# Add CORS middleware to handle requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, you'd want to be more specific
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variable to control server shutdown
shutdown_requested = False


@app.get('/')
async def read_index() -> FileResponse:
    return FileResponse(os.path.join(package_dir, 'index.html'))


@app.post('/shutdown')
async def shutdown() -> JSONResponse:
    """Endpoint to gracefully shutdown the server when browser window is closed."""
    global shutdown_requested
    if shutdown_requested:
        return JSONResponse({"status": "already_shutting_down"})
    
    shutdown_requested = True
    
    def delayed_shutdown():
        time.sleep(0.2)
        os.kill(os.getpid(), signal.SIGTERM)
    
    threading.Thread(target=delayed_shutdown, daemon=True).start()
    return JSONResponse({"status": "shutdown_initiated"})




# Mount static files after API routes to avoid conflicts
app.mount('/', StaticFiles(directory=package_dir, html=True), name='static')


def main() -> None:
    for port in range(8000, 8050):
        try:
            with socket.socket() as s:
                s.bind(('localhost', port))
            break
        except OSError:
            pass
    else:
        print('No available ports found')
        exit(1)

    threading.Thread(
        target=lambda: (
            time.sleep(0.5),
            webbrowser.open(f'http://localhost:{port}'),
        ),
        daemon=True,
    ).start()

    def signal_handler(signum, frame):
        print("\nServer shutting down gracefully...")
        exit(0)
    
    # Register signal handler for graceful shutdown
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)  # Ctrl+C

    print(f'Serving on http://localhost:{port}')
    print('Server will automatically stop when you close the browser window.')
    print('Press Ctrl+C to stop manually.')
    
    try:
        uvicorn.run(app, host='localhost', port=port, log_level='warning')
    except KeyboardInterrupt:
        print("\nServer stopped by user.")
