import os
import socket
import threading
import time
import webbrowser

import uvicorn
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

package_dir = os.path.dirname(os.path.abspath(__file__))
app = FastAPI()
app.mount('/', StaticFiles(directory=package_dir, html=True), name='static')


@app.get('/')
async def read_index() -> FileResponse:
    return FileResponse(os.path.join(package_dir, 'index.html'))


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

    print(f'Serving on http://localhost:{port}\nPress Ctrl+C to stop')
    uvicorn.run(app, host='localhost', port=port, log_level='warning')
