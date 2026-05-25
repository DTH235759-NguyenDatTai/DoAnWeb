import base64
import os
import tempfile
import uuid
from pathlib import Path
from urllib.parse import urlparse

import requests
from flask import Flask, jsonify, request, send_from_directory, url_for
from gradio_client import Client, handle_file


app = Flask(__name__)

IDM_VTON_GRADIO_URL = os.environ.get("IDM_VTON_GRADIO_URL", "http://127.0.0.1:7860")
PUBLIC_BASE_URL = os.environ.get("IDM_VTON_PUBLIC_BASE_URL", "http://127.0.0.1:5005")
OUTPUT_DIR = Path(os.environ.get("IDM_VTON_OUTPUT_DIR", "./idm_vton_outputs"))
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def download_image(image_url):
    if image_url.startswith("data:image/"):
        _, data = image_url.split(",", 1)
        suffix = ".png"
        fd, path = tempfile.mkstemp(suffix=suffix)
        with os.fdopen(fd, "wb") as file:
            file.write(base64.b64decode(data))
        return path

    parsed = urlparse(image_url)
    suffix = Path(parsed.path).suffix or ".png"
    fd, path = tempfile.mkstemp(suffix=suffix)

    with requests.get(image_url, timeout=30, stream=True) as response:
        response.raise_for_status()
        with os.fdopen(fd, "wb") as file:
            for chunk in response.iter_content(chunk_size=1024 * 256):
                if chunk:
                    file.write(chunk)

    return path


def select_idm_garment(garments):
    priority = ["shirt", "top", "upper_body", "ao"]

    for garment_type in priority:
        for item in garments:
            if (item.get("type") or "").lower() == garment_type:
                return item

    return garments[0] if garments else None


def build_description(garment):
    garment_type = (garment.get("type") or "shirt").replace("_", " ")
    return garment.get("description") or f"{garment_type} clothing"


@app.post("/try-on")
def try_on():
    payload = request.get_json(silent=True) or {}
    garments = payload.get("garments") or []
    garment = select_idm_garment(garments)

    if not payload.get("model_image_url"):
        return jsonify(success=False, message="Missing model_image_url."), 400

    if not garment or not garment.get("image_url"):
        return jsonify(success=False, message="Missing garment image_url."), 400

    if (garment.get("type") or "").lower() in {"pants", "shoes"}:
        return jsonify(
            success=False,
            message="IDM-VTON Gradio demo mac dinh chi ho tro upper_body. Hay thu ao truoc."
        ), 400

    human_path = download_image(payload["model_image_url"])
    garment_path = download_image(garment["image_url"])

    client = Client(IDM_VTON_GRADIO_URL)
    human_editor_value = {
        "background": handle_file(human_path),
        "layers": [],
        "composite": None
    }

    result = client.predict(
        human_editor_value,
        handle_file(garment_path),
        build_description(garment),
        True,
        False,
        30,
        int(payload.get("seed") or 42),
        api_name="/tryon"
    )

    output_path = result[0] if isinstance(result, (list, tuple)) else result
    output_name = f"tryon_{uuid.uuid4().hex}.png"
    final_path = OUTPUT_DIR / output_name

    with open(output_path, "rb") as source, open(final_path, "wb") as target:
        target.write(source.read())

    image_url = f"{PUBLIC_BASE_URL}{url_for('outputs', filename=output_name)}"

    return jsonify(success=True, imageUrl=image_url)


@app.get("/outputs/<path:filename>")
def outputs(filename):
    return send_from_directory(OUTPUT_DIR, filename)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5005")))
