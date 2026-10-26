"""Blurs the regions SAM found (scripts/sam-boxes.mjs) in every frame of a
video and drops the audio. Used to anonymize people in demo footage.

Usage: python3 scripts/blur-boxes.py <in.mp4> <boxes.json> <out.mp4>
Boxes are padded and held for a few frames around each detection, so a frame
where SAM momentarily loses a person is still covered.
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageFilter

PAD = 0.20   # grow each box by 20% per side
HOLD = 6     # frames before/after a detection that reuse its box

src, boxes_path, dst = sys.argv[1:4]
frames = {int(k): v for k, v in json.load(open(boxes_path))["frames"].items()}

with tempfile.TemporaryDirectory() as tmp:
    tmp = Path(tmp)
    subprocess.run(["ffmpeg", "-v", "error", "-i", src, str(tmp / "f%05d.png")], check=True)
    paths = sorted(tmp.glob("f*.png"))
    for i, p in enumerate(paths):
        regions = [b for j in range(i - HOLD, i + HOLD + 1) for b in frames.get(j, [])]
        if not regions:
            continue
        img = Image.open(p).convert("RGB")
        W, H = img.size
        for b in regions:
            sx, sy = W / b["w"], H / b["h"]
            bw, bh = (b["x2"] - b["x1"]) * sx, (b["y2"] - b["y1"]) * sy
            x1 = max(0, int(b["x1"] * sx - bw * PAD)); y1 = max(0, int(b["y1"] * sy - bh * PAD))
            x2 = min(W, int(b["x2"] * sx + bw * PAD)); y2 = min(H, int(b["y2"] * sy + bh * PAD))
            if x2 > x1 and y2 > y1:
                img.paste(img.crop((x1, y1, x2, y2)).filter(ImageFilter.GaussianBlur(18)), (x1, y1))
        img.save(p)
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-framerate", "30", "-i", str(tmp / "f%05d.png"),
         "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", dst],
        check=True,
    )
print(f"blurred {len(frames)} frames with detections -> {dst}")
