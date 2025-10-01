#!/usr/bin/env python3
import os
import socket
import threading
import time
import webbrowser

import uvicorn
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# Use the directory containing this file (where static files are now located)
static_dir = os.path.dirname(os.path.abspath(__file__))

app = FastAPI()
app.mount('/', StaticFiles(directory=static_dir, html=True), name='static')


@app.get('/')
async def read_index() -> FileResponse:
    return FileResponse(os.path.join(static_dir, 'index.html'))


def main() -> None:
    for port in range(8000, 8050):
        try:
            with socket.socket() as s:
                s.bind(('localhost', port))
            break
        except OSError:
            continue
    else:
        print('No available ports found')
        exit(1)

    print(f'Serving on http://localhost:{port}\nPress Ctrl+C to stop')
    threading.Thread(
        target=lambda: (
            time.sleep(0.5),
            webbrowser.open(f'http://localhost:{port}'),
        ),
        daemon=True,
    ).start()

    uvicorn.run(app, host='localhost', port=port, log_level='warning')


if __name__ == '__main__':
    main()
