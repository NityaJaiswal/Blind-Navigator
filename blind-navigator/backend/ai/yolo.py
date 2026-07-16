from ultralytics import YOLO
import cv2

class YOLODetector:
    _instance = None

    def __init__(self):
        print("Loading YOLOv8 model...")
        self.model = YOLO("yolov8n.pt")
        print("YOLO loaded successfully.")

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = YOLODetector()
        return cls._instance

    def detect(self, image_path: str):
        results = self.model(image_path)

        detections = []

        for result in results:
            boxes = result.boxes

            for box in boxes:
                cls = int(box.cls[0])
                confidence = float(box.conf[0])

                x1, y1, x2, y2 = box.xyxy[0].tolist()

                detections.append({
                    "label": self.model.names[cls],
                    "confidence": round(confidence, 3),
                    "bbox": [
                        int(x1),
                        int(y1),
                        int(x2),
                        int(y2)
                    ]
                })

        return detections