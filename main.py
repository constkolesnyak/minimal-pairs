#!/usr/bin/env python3
import socket
import threading
import time
import webbrowser

import uvicorn
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()
app.mount('/', StaticFiles(directory='.', html=True), name='static')


@app.get('/')
async def read_index() -> FileResponse:
    return FileResponse('index.html')


if __name__ == '__main__':
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

    print(f'Server running on http://localhost:{port}')
    threading.Thread(
        target=lambda: (time.sleep(1), webbrowser.open(f'http://localhost:{port}')), daemon=True
    ).start()

    uvicorn.run(app, host='localhost', port=port, log_level='warning')
