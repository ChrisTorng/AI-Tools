# Copista / Copisteria — Pinokio App

Unofficial launcher for [KobiMusic/copisteria](https://github.com/kobimusic/copisteria).

Install the whole folder as an app under Pinokio's local `api/` directory; click Install then Start. To use Download from URL, publish this folder as the root of its own GitHub repository first (nested paths are not installable via that option).

- Tested target: Ubuntu 26.04 x64 / NVIDIA RTX 4090. Windows x64 unverified.
- Isolated Python 3.12 via Pinokio's uv AI bundle, source cloned in `app/source`.
- Install downloads upstream code, Python dependencies and 28M/2M Hugging Face model weights.
- Start opens local port 50882 with upload, results and ZIP download; preserves `app/runs/` across updates.
- PDF requires Poppler: `sudo apt install poppler-utils`. Uses default 28M detector, selectable 2M detector.
- Changes to upstream source: none. Install/runtime validation on user's Ubuntu 4090 remains pending.
