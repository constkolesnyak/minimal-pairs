# Minimal Pairs

[Try it online.](https://constkolesnyak.github.io/minimal-pairs)

Or install and run locally with [pipx](https://pipx.pypa.io):

    pipx install git+https://github.com/constkolesnyak/minimal-pairs
    kmpt

## About

It's a fork of [Kuuuube/minimal-pairs](https://github.com/Kuuuube/minimal-pairs)
which is itself a backup of the [コツ minimal pairs test](https://kotu.io/tests/pitchAccent/perception/minimalPairs).

## After vs Before

![](misc/after.png)
![](misc/before.png)

## My Improvements

- Better server: FastAPI + Uvicorn
- Some additional features
- Pretty UI

## GitHub Pages Hosting

The frontend is fully static, so you can host it with GitHub Pages:

1.  Sync the `docs/`:

        python3 scripts/export_static_site.py

2.  Commit and push the updated `docs/`.
3.  In the repository settings, enable GitHub Pages with the source set to `main` → `/docs`.

When served from GitHub Pages the quit shortcut is disabled automatically. Everything else works the same as the local FastAPI app.
