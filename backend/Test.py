from ultralytics import YOLO
import cv2
import json
import requests
import datetime
import numpy as np
import os

MODEL = r"E:/java-chat-app/runs/classify/civicx_cls_model6/weights/best.pt"
model = YOLO(MODEL)

LOG_FILE = "detections_log.json"


# ---------------- LOCATION FETCHER ----------------
def get_location():
    try:
        res = requests.get("https://ipinfo.io/json", timeout=5).json()
        loc = res.get("loc", None)
        if loc:
            lat, lon = loc.split(",")
            return {"lat": lat, "lon": lon, "city": res.get("city"), "region": res.get("region")}
    except:
        pass
    return {"lat": None, "lon": None, "city": None, "region": None}


# ---------------- SAVE DETECTION ----------------
def save_detection(predicted_class):
    location = get_location()

    entry = {
        "timestamp": str(datetime.datetime.now()),
        "class_detected": predicted_class,
        "location": location
    }

    if not os.path.exists(LOG_FILE):
        with open(LOG_FILE, "w") as f:
            json.dump([], f, indent=4)

    data = json.load(open(LOG_FILE))
    data.append(entry)

    with open(LOG_FILE, "w") as f:
        json.dump(data, f, indent=4)

    print("✔ Saved detection:", entry)


# ---------------- SKETCH EFFECT ----------------
def apply_sketch(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 80, 150)
    edges_colored = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)
    output = cv2.addWeighted(frame, 0.8, edges_colored, 0.5, 0)
    return output


# ---------------- STATIC IMAGE TEST ----------------
def test_image(img_path):
    img = cv2.imread(img_path)
    results = model(img)

    for r in results:
        pred = r.names[r.probs.top1]

    print("Predicted:", pred)
    save_detection(pred)

    img_sketch = apply_sketch(img)
    cv2.putText(img_sketch, pred, (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    cv2.imshow("YOLO Classification + Sketch", img_sketch)
    cv2.waitKey(0)
    cv2.destroyAllWindows()


# ---------------- LIVE CAMERA TEST ----------------
def test_webcam():
    cap = cv2.VideoCapture(0)

    prev_pred = None
    start_time = None
    saved_for_this_class = False
    REQUIRED_DURATION = 3  # seconds

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        results = model(frame)
        pred = results[0].names[results[0].probs.top1]

        # Start timer when new prediction appears
        if pred != prev_pred:
            prev_pred = pred
            start_time = datetime.datetime.now()
            saved_for_this_class = False  # reset save flag

        # Calculate duration for which same pred is stable
        elapsed = (datetime.datetime.now() - start_time).total_seconds()

        # Save only if stable for 3 seconds and NOT already saved
        if elapsed >= REQUIRED_DURATION and not saved_for_this_class:
            save_detection(pred)
            saved_for_this_class = True

        frame_sketch = apply_sketch(frame)

        cv2.putText(frame_sketch, f"{pred} ({elapsed:.1f}s)", (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        cv2.imshow("YOLO Classification Live + Sketch Overlay", frame_sketch)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()


# ---------------- RUN ----------------
# test_image("sample.jpg")
test_webcam()
