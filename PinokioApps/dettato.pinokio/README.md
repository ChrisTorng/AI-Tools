# Dettato — Pinokio App

Unofficial launcher for [KobiMusic/dettato](https://github.com/kobimusic/dettato).

Install the whole folder as an app under Pinokio's local `api/` directory; click Install then Start. To use Download from URL, publish this folder as the root of its own GitHub repository first (nested paths are not installable via that option).

- Tested target: Ubuntu 26.04 x64 / NVIDIA RTX 4090. Windows x64 unverified.
- Isolated Python 3.12 via Pinokio's uv AI bundle, source cloned in `app/source`.
- Install downloads upstream code, Python dependencies and Dettato Hugging Face weights on first processing.
- Start opens local port 50881 with upload, results and ZIP download; preserves `app/runs/` across updates.
- For m4a/aac and some mp3 use ffmpeg installed on the host.
- Changes to upstream source: none. Install/runtime validation on user's Ubuntu 4090 remains pending.
