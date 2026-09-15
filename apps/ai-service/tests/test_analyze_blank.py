from io import BytesIO

import numpy as np
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_analyze_blank_image_has_no_faces():
    buffer = BytesIO()
    Image.fromarray(np.zeros((320, 320, 3), dtype=np.uint8)).save(buffer, format="JPEG")
    files = {"file": ("blank.jpg", buffer.getvalue(), "image/jpeg")}
    response = client.post("/v1/analyze", files=files)
    assert response.status_code == 200
    body = response.json()
    assert body["faces"] == []
    assert "sface" in body["provider"]
