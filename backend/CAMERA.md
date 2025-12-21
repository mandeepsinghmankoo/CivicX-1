# Server Camera Mode — Quick Notes

How it works
- The server can capture from a local physical camera (cv2.VideoCapture(0)) and run continuous classification.
- The frontend has a "Use server camera" checkbox. When checked and you click "Open Camera":
  - The frontend calls `POST /Interference/start-webcam/` which starts a background thread on the Django backend.
  - The frontend will poll `/Interference/previews/` (thumbnail images) and `/Interference/latest-detection/` (latest log entry) every 2s to update the UI.

Common issues & troubleshooting
- "Could not access camera (maybe it's in use)":
  - This happens when the browser or another process already has the camera opened. Close the browser tab that uses the camera (or uncheck the frontend camera), then try starting the server camera again.
- If you see "Waiting for server preview...", the server thread hasn't yet saved a preview file — give it a few seconds.
- When using server camera mode, do NOT also open local browser camera for the same physical device at the same time.

Testing
1. Run the Django server (e.g., `python manage.py runserver 0.0.0.0:8000`) on the machine that has the camera attached.
2. Open the frontend locally, go to the report form, check "Use server camera" and click "Open Camera".
3. If successful you'll see preview thumbnails and the latest detection will be shown.

If problems persist, check server logs — the backend now prints helpful messages when the camera cannot be opened or when image decoding/inference fails.
