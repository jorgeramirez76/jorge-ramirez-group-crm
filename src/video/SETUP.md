# daVinci-MagiHuman Setup Guide

MagiHuman requires NVIDIA GPU with Flash Attention for real-time performance.
On Mac (MPS), it will run but slowly (~30-60s per 5-second clip).

## Option 1: Docker (Recommended for testing)
```bash
docker pull sandai/magi-human:latest
```
Note: This image is x86_64 — will run via Rosetta on Apple Silicon.

## Option 2: Cloud GPU (Recommended for production)
Use RunPod, Lambda, or similar:
- Rent an H100/A100 GPU (~$1-2/hr)
- Generate videos in 2 seconds per clip
- Use on-demand — only pay when generating videos

## Option 3: Native Install (Mac MPS — slow but free)
```bash
git clone https://github.com/GAIR-NLP/daVinci-MagiHuman
cd daVinci-MagiHuman
pip install -r requirements.txt
# Download models from HuggingFace: GAIR/daVinci-MagiHuman
```

## Integration
The Remotion templates in jorge-videos/ handle video composition.
MagiHuman generates the talking head clip, Remotion adds branding/overlays.
The n8n workflow triggers the full pipeline automatically.
