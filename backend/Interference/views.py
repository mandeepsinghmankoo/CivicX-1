import cv2
import json
import datetime
import threading
import requests
import numpy as np
import os
import time
from django.http import JsonResponse, HttpResponse, FileResponse
from django.views.decorators.csrf import csrf_exempt

from ultralytics import YOLO

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---------------------- MODEL PATH ----------------------
# Try multiple possible model paths
MODEL_PATHS = [
    r"D:/CivicX-Final/CivicX-1/backend/runs/classify/civicx_cls_model6/weights/best.pt",
    os.path.join(BASE_DIR, "runs", "classify", "civicx_cls_model6", "weights", "best.pt"),
    os.path.join(BASE_DIR, "models", "best.pt"),
    "yolov8n-cls.pt"  # fallback to default YOLOv8 classification model
]

MODEL_PATH = None
for path in MODEL_PATHS:
    if os.path.exists(path):
        MODEL_PATH = path
        break

if MODEL_PATH is None:
    print("Warning: No model file found. Using default YOLOv8 classification model.")
    MODEL_PATH = "yolov8n-cls.pt"  # This will auto-download if not present

print(f"Loading model from: {MODEL_PATH}")
model = YOLO(MODEL_PATH)
LOG_FILE = os.path.join(BASE_DIR, "detections_log.json")
PREVIEWS_DIR = os.path.join(BASE_DIR, "previews")

# Thread control
webcam_thread = None
webcam_stop_event = threading.Event()



# ---------------------- LOCATION FETCHER ----------------------
def get_location():
    try:
        res = requests.get("https://ipinfo.io/json", timeout=5).json()
        loc = res.get("loc", None)
        if loc:
            lat, lon = loc.split(",")
            return {
                "lat": lat,
                "lon": lon,
                "city": res.get("city"),
                "region": res.get("region")
            }
    except:
        pass

    return {"lat": None, "lon": None, "city": None, "region": None}


# ---------------------- SAVE DETECTION ----------------------
def save_detection(predicted_class):
    location = get_location()

    entry = {
        "timestamp": str(datetime.datetime.now()),
        "class_detected": predicted_class,
        "location": location
    }

    # Ensure log file exists with a JSON array; handle empty/corrupt files gracefully
    if not os.path.exists(LOG_FILE):
        with open(LOG_FILE, "w", encoding="utf-8") as f:
            json.dump([], f, indent=4)

    try:
        with open(LOG_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            if not isinstance(data, list):
                # If the file contains a JSON object or other type, reset to list
                data = []
    except (json.JSONDecodeError, ValueError):
        # Empty or malformed JSON — reinitialize the log
        print(f"Warning: '{LOG_FILE}' is empty or malformed. Reinitializing log file.")
        data = []
    except Exception as e:
        # Any other file error — print and fallback to empty list
        print(f"Error reading log file '{LOG_FILE}':", e)
        data = []

    data.append(entry)

    try:
        with open(LOG_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4)
    except Exception as e:
        print(f"Error writing to log file '{LOG_FILE}':", e)

    print("✔ Saved detection:", entry)


def _save_preview_image(frame):
    try:
        if not os.path.exists(PREVIEWS_DIR):
            os.makedirs(PREVIEWS_DIR, exist_ok=True)
        ts = int(time.time() * 1000)
        fname = f"preview_{ts}.jpg"
        path = os.path.join(PREVIEWS_DIR, fname)
        # write a resized small preview to save space
        small = cv2.resize(frame, (320, 320))
        cv2.imwrite(path, small, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
        return fname
    except Exception as e:
        print("Error saving preview image:", e)
        return None


# ---------------------- SKETCH EFFECT ----------------------
def apply_sketch(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 80, 150)
    edges_colored = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)
    output = cv2.addWeighted(frame, 0.8, edges_colored, 0.5, 0)
    return output


# ---------------------- STATIC IMAGE CLASSIFICATION ----------------------
@csrf_exempt
def classify_image(request):
    if request.method != "POST":
        return JsonResponse({"error": "Send POST request with image."})

    img_file = request.FILES.get("image")
    if not img_file:
        return JsonResponse({"error": "No image uploaded."})

    # Convert Uploaded file to OpenCV image
    file_bytes = np.asarray(bytearray(img_file.read()), dtype=np.uint8)
    img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    if img is None:
        # decoding failed
        print("classify_image: failed to decode uploaded image")
        return JsonResponse({"error": "Could not decode image"}, status=400)

    try:
        results = model(img)
    except Exception as e:
        print("classify_image: model inference error:", e)
        return JsonResponse({"error": "Model inference failed"}, status=500)
    # Attempt to extract label and confidence safely
    try:
        res0 = results[0]
        probs = getattr(res0, 'probs', None)
        if probs is not None:
            # probs may be a numpy array or an object with top1
            if isinstance(probs, (list, tuple)) or hasattr(probs, 'tolist'):
                probs_arr = np.array(probs)
                top_idx = int(np.argmax(probs_arr))
                confidence = float(probs_arr[top_idx])
            else:
                # object with top1 attribute
                top_idx = int(getattr(probs, 'top1', 0))
                confidence = float(probs[top_idx])
        else:
            # If probs not available, fallback to top1 if present
            top_idx = getattr(res0, 'probs', None)
            confidence = None

        pred = res0.names[top_idx] if res0 and top_idx is not None else None
    except Exception:
        pred = None
        confidence = None

    if pred:
        save_detection(pred)

    return JsonResponse({
        "status": "success",
        "predicted_class": pred,
        "confidence": float(confidence) if confidence is not None else None
    })


@csrf_exempt
def latest_detection(request):
    """Return the most recent detection record from the JSON log file."""
    try:
        if not os.path.exists(LOG_FILE):
            return JsonResponse({"latest": None})

        with open(LOG_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if not isinstance(data, list) or len(data) == 0:
                return JsonResponse({"latest": None})
            latest = data[-1]
            return JsonResponse({"latest": latest})
    except Exception as e:
        print("latest_detection error:", e)
        return JsonResponse({"error": "Could not fetch latest detection"}, status=500)


# ---------------------- AUTO-ROUTE REPORT ENDPOINT ----------------------
# Map predicted categories to municipal departments (case-insensitive)
CATEGORY_TO_DEPARTMENT = {
    "garbage": "Sanitation",
    "pothole": "PWD",
    "road crack": "PWD",
    "broken streetlight": "Electrical",
    "water leakage": "WaterDept",
    "drain blockage": "DrainageDept",
}


def _normalize_label(label):
    if not label:
        return None
    key = label.strip().lower().replace('_', ' ')
    key = ' '.join(key.split())
    return key


@csrf_exempt
def report_issue(request):
    """Endpoint to accept an uploaded image, classify it, auto-assign to department, and return structured JSON.
    POST fields: image
    Returns: JSON {issue_type, assigned_department, confidence, status}
    """
    if request.method != 'POST':
        return JsonResponse({"error": "Send POST request with image."}, status=400)

    img_file = request.FILES.get('image')
    if not img_file:
        return JsonResponse({"error": "No image uploaded."}, status=400)

    try:
        # Convert to OpenCV image
        file_bytes = np.asarray(bytearray(img_file.read()), dtype=np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Image decode failed")

        # Predict using existing model
        results = model(img)
        res0 = results[0]

        # Extract label and confidence robustly
        try:
            probs = getattr(res0, 'probs', None)
            if probs is not None:
                if isinstance(probs, (list, tuple)) or hasattr(probs, 'tolist'):
                    probs_arr = np.array(probs)
                    top_idx = int(np.argmax(probs_arr))
                    confidence = float(probs_arr[top_idx])
                else:
                    top_idx = int(getattr(probs, 'top1', 0))
                    confidence = float(probs[top_idx])
            else:
                top_idx = None
                confidence = None
        except Exception:
            top_idx = None
            confidence = None

        label = res0.names[top_idx] if (res0 and top_idx is not None) else None

        # Save detection and preview if label found
        if label:
            save_detection(label)
            try:
                _save_preview_image(img)
            except Exception:
                pass

        # Map to department
        assigned_department = CATEGORY_TO_DEPARTMENT.get(_normalize_label(label), 'Unassigned') if label else 'Unassigned'

        return JsonResponse({
            "issue_type": str(label) if label else None,
            "assigned_department": assigned_department,
            "confidence": float(confidence) if confidence is not None else None,
            "status": "Auto-Routed" if label else "Could not classify",
        })

    except Exception as e:
        print('report_issue error:', e)
        return JsonResponse({"error": "Internal server error"}, status=500)


# ---------------------- BACKGROUND THREAD FOR WEBCAM ----------------------
def webcam_detection_thread():
    cap = cv2.VideoCapture(0)

    # Check if camera was acquired successfully
    if not cap.isOpened():
        print("webcam_detection_thread: could not open camera (maybe it's in use by the browser)")
        try:
            cap.release()
        except Exception:
            pass
        return

    prev_pred = None
    start_time = None
    saved_for_this_class = False
    REQUIRED_DURATION = 3

    try:
        while not webcam_stop_event.is_set():
            ret, frame = cap.read()
            if not ret:
                break

            results = model(frame)
            pred = results[0].names[results[0].probs.top1]

            if pred != prev_pred:
                prev_pred = pred
                start_time = datetime.datetime.now()
                saved_for_this_class = False

            elapsed = (datetime.datetime.now() - start_time).total_seconds()

            if elapsed >= REQUIRED_DURATION and not saved_for_this_class:
                # Save detection record
                save_detection(pred)
                # Save a small preview image for frontend
                try:
                    _save_preview_image(frame)
                except Exception:
                    pass
                saved_for_this_class = True

            frame_sketch = apply_sketch(frame)
            cv2.putText(frame_sketch, f"{pred} ({elapsed:.1f}s)", (20, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

            cv2.imshow("YOLO Webcam Live Classification", frame_sketch)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    except Exception as e:
        print("Webcam thread error:", e)
    finally:
        try:
            cap.release()
        except Exception:
            pass
        try:
            cv2.destroyAllWindows()
        except Exception:
            pass


@csrf_exempt
@csrf_exempt
def stop_webcam(request):
    """Stop the background webcam thread."""
    global webcam_thread
    try:
        webcam_stop_event.set()
        # wait briefly for thread to exit
        if webcam_thread and webcam_thread.is_alive():
            webcam_thread.join(timeout=2)
        webcam_thread = None
        return JsonResponse({"status": "stopped"})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


def list_previews(request):
    """Return JSON list of preview image URLs (newest first)."""
    try:
        if not os.path.exists(PREVIEWS_DIR):
            return JsonResponse({"previews": []})
        files = [f for f in os.listdir(PREVIEWS_DIR) if f.lower().endswith('.jpg') or f.lower().endswith('.jpeg') or f.lower().endswith('.png')]
        files.sort(key=lambda fn: os.path.getmtime(os.path.join(PREVIEWS_DIR, fn)), reverse=True)
        # build absolute URLs
        urls = [request.build_absolute_uri(f"/Interference/preview/{f}") for f in files]
        return JsonResponse({"previews": urls})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


def preview_image(request, filename):
    path = os.path.join(PREVIEWS_DIR, filename)
    if not os.path.exists(path):
        return HttpResponse(status=404)
    return FileResponse(open(path, 'rb'), content_type='image/jpeg')


@csrf_exempt
def capture_now(request):
    """Capture a single frame from the server camera (or direct VideoCapture) and save to previews."""
    try:
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            try:
                cap.release()
            except Exception:
                pass
            return JsonResponse({"error": "Could not access camera"}, status=500)

        ret, frame = cap.read()
        try:
            cap.release()
        except Exception:
            pass

        if not ret or frame is None:
            return JsonResponse({"error": "Failed to capture frame"}, status=500)

        fname = _save_preview_image(frame)
        if not fname:
            return JsonResponse({"error": "Failed to save preview"}, status=500)

        url = request.build_absolute_uri(f"/Interference/preview/{fname}")
        return JsonResponse({"status": "ok", "url": url})
    except Exception as e:
        print('capture_now error:', e)
        return JsonResponse({"error": str(e)}, status=500)


# ---------------------- START WEBCAM STREAM (API) ----------------------
@csrf_exempt
def start_webcam(request):
    global webcam_thread
    try:
        # If a thread is already running, just return
        if webcam_thread and webcam_thread.is_alive():
            return JsonResponse({"status": "already_running"})

        # quick check: try opening the camera briefly to ensure it's available
        temp_cap = cv2.VideoCapture(0)
        if not temp_cap.isOpened():
            try:
                temp_cap.release()
            except Exception:
                pass
            return JsonResponse({"error": "Could not access camera (maybe it's in use)"}, status=500)
        try:
            temp_cap.release()
        except Exception:
            pass

        # ensure stop event is cleared and start thread
        webcam_stop_event.clear()
        webcam_thread = threading.Thread(target=webcam_detection_thread)
        webcam_thread.daemon = True
        webcam_thread.start()
        return JsonResponse({"status": "Webcam detection started!"})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
