from fastapi import APIRouter, UploadFile, File, HTTPException
import tempfile
import shutil
import os

from ai.yolo import YOLODetector

router = APIRouter(
    prefix="/vision",
    tags=["Vision"]
)

# Load YOLO only once when the server starts
detector = YOLODetector.get_instance()


@router.post("/detect")
async def detect_objects(file: UploadFile = File(...)):
    try:
        # Get uploaded file extension
        suffix = os.path.splitext(file.filename)[1]

        # Save uploaded image temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
            shutil.copyfileobj(file.file, temp)
            temp_path = temp.name

        # Run YOLO detection
        detections = detector.detect(temp_path)

        # Delete temporary image
        os.remove(temp_path)

        return {
            "success": True,
            "count": len(detections),
            "detections": detections,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"YOLO detection failed: {str(e)}"
        )