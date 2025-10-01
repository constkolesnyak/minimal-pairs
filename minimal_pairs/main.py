import os
import signal
import socket
import threading
import time
import webbrowser
from typing import Any, NoReturn

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

package_dir = os.path.dirname(os.path.abspath(__file__))
shutdown_requested = False

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.get('/')
async def read_index() -> FileResponse:
    return FileResponse(os.path.join(package_dir, 'index.html'))


@app.post('/shutdown')
async def shutdown() -> JSONResponse:
    global shutdown_requested
    if shutdown_requested:
        return JSONResponse({'status': 'already_shutting_down'})

    shutdown_requested = True

    def delayed_shutdown() -> None:
        time.sleep(0.2)
        os.kill(os.getpid(), signal.SIGTERM)

    threading.Thread(target=delayed_shutdown, daemon=True).start()
    return JSONResponse({'status': 'shutdown_initiated'})


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

    def stop_server(*args: Any) -> NoReturn:
        print('\nStopping...')
        exit(0)

    signal.signal(signal.SIGTERM, stop_server)
    signal.signal(signal.SIGINT, stop_server)

    print(
        f'Serving on http://localhost:{port}\n'
        'Server will automatically stop when you close the browser window.\n'
        'Press Ctrl+C to stop manually.'
    )

    try:
        uvicorn.run(app, host='localhost', port=port, log_level='warning')
    except KeyboardInterrupt:
        stop_server()
