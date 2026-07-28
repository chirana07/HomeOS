# ocr_engine.py
import io
import time
from typing import Dict, Any, List, Optional
import numpy as np
from PIL import Image
from rapidocr_onnxruntime import RapidOCR

# Default confidence threshold for local OCR acceptance
OCR_CONFIDENCE_THRESHOLD = 0.75

class RapidOCREngine:
    """
    Lightweight, high-performance local ONNX OCR Engine for grocery receipt extraction.
    Provides sub-300ms local inference with per-line confidence scoring.
    """
    def __init__(self):
        self._engine: Optional[RapidOCR] = None

    def _get_engine(self) -> RapidOCR:
        if self._engine is None:
            self._engine = RapidOCR()
        return self._engine

    def extract_text(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Processes image bytes via RapidOCR and returns structured line items,
        average confidence score, and concatenated raw text.
        """
        t_start = time.time()
        if not image_bytes:
            return {
                "success": False,
                "raw_text": "",
                "average_confidence": 0.0,
                "lines": [],
                "execution_sec": 0.0
            }

        try:
            # Load PIL Image from bytes and convert to numpy RGB array for OpenCV/RapidOCR
            pil_img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
            img_np = np.array(pil_img)

            ocr = self._get_engine()
            results, elapse = ocr(img_np)

            if not results:
                return {
                    "success": False,
                    "raw_text": "",
                    "average_confidence": 0.0,
                    "lines": [],
                    "execution_sec": round(time.time() - t_start, 3)
                }

            extracted_lines: List[Dict[str, Any]] = []
            text_parts: List[str] = []
            confidences: List[float] = []

            for item in results:
                # RapidOCR item format: [ bbox_coordinates, text_string, confidence_float ]
                if len(item) >= 3:
                    bbox = item[0]
                    text = str(item[1]).strip()
                    conf = float(item[2])

                    if text:
                        text_parts.append(text)
                        confidences.append(conf)
                        extracted_lines.append({
                            "text": text,
                            "confidence": round(conf, 4),
                            "bbox": bbox
                        })

            avg_conf = float(np.mean(confidences)) if confidences else 0.0
            raw_text = "\n".join(text_parts)
            execution_sec = round(time.time() - t_start, 3)

            return {
                "success": len(extracted_lines) > 0,
                "raw_text": raw_text,
                "average_confidence": round(avg_conf, 4),
                "lines": extracted_lines,
                "execution_sec": execution_sec
            }

        except Exception as e:
            print(f"RapidOCR Processing Error: {e}")
            return {
                "success": False,
                "raw_text": "",
                "average_confidence": 0.0,
                "lines": [],
                "execution_sec": round(time.time() - t_start, 3)
            }

# Singleton instance helper
_ocr_engine_instance: Optional[RapidOCREngine] = None

def get_ocr_engine() -> RapidOCREngine:
    global _ocr_engine_instance
    if _ocr_engine_instance is None:
        _ocr_engine_instance = RapidOCREngine()
    return _ocr_engine_instance
