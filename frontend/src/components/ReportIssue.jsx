// src/pages/ReportIssue.jsx
import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import configService from "../appwrite/config";
import { Button, Input, Logo } from "../components/Index";

function ReportIssue() {
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [files, setFiles] = useState([]);
  const [filePreviewUrls, setFilePreviewUrls] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState(null); // { label, confidence }
  const [liveDetections, setLiveDetections] = useState([]); // [{x, y, w, h, label, confidence}]
  const [isLiveDetection, setIsLiveDetection] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const userData = useSelector((state) => state.auth.userData);

  // Only citizens can access
  useEffect(() => {
    if (!userData) {
      navigate("/login");
      return;
    }
    if (userData.role !== "citizen") {
      navigate("/"); // officials redirected
    }
  }, [userData, navigate]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const locStr = `${pos.coords.latitude}, ${pos.coords.longitude}`;
          setLocation(locStr);
          setValue("location", locStr);
          setValue("lat", pos.coords.latitude);
          setValue("lng", pos.coords.longitude);
        },
        () => { }
      );
    }
  }, [setValue]);

  const categories = [
    "Garbage", "Pothole", "Water Leak", "Streetlight", "Sewer Overflow",
    "Broken Bench", "Damaged Road Sign", "Noise Issue", "Electricity", "Others"
  ];

  const handleFileChange = async (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length > 3) {
      setError("Max 3 files allowed");
      return;
    }
    setFiles(selected);
    setFilePreviewUrls(selected.map((f) => URL.createObjectURL(f)));

    // Auto-detect issues from uploaded images
    if (selected.length > 0) {
      const imageFiles = selected.filter(f => f.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        setDetecting(true);
        setDetected(null);

        try {
          // Use the first image for detection
          const file = imageFiles[0];
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const dataUrl = e.target.result;
              const imageBase64 = dataUrl.split(',')[1];
              const result = await configService.detectIssueCategoryFromBase64({ imageBase64 });
              if (result && result.label) {
                setValue("category", result.label);
                setDetected({ label: result.label, confidence: result.confidence });
              }
            } catch (err) {
              console.log("Detection failed for uploaded image:", err);
            } finally {
              setDetecting(false);
            }
          };
          reader.readAsDataURL(file);
        } catch {
          setDetecting(false);
        }
      }
    }
  };

 


  useEffect(() => {
    const drawBoundingBoxes = () => {
      if (!canvasRef.current || !videoRef.current) return;

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = video.videoWidth || 720;
      canvas.height = video.videoHeight || 1280;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      liveDetections.forEach(detection => {
        const { x, y, w, h, label, confidence } = detection;
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = "#00ff00";
        ctx.font = "14px Arial";
        ctx.fillText(`${label} (${Math.round(confidence * 100)}%)`, x, y - 5);
      });
    };

    if (liveDetections.length > 0) {
      drawBoundingBoxes();
    }
  }, [liveDetections]);

  const capturePhoto = async () => {
    try {
      if (!videoRef.current) return;
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 720;
      canvas.height = video.videoHeight || 1280;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

      // Convert dataURL to File
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: "image/jpeg" });

      const nextFiles = [...files, file].slice(0, 3);
      setFiles(nextFiles);
      setFilePreviewUrls(nextFiles.map((f) => URL.createObjectURL(f)));

      // Trigger detection for this capture
      setDetecting(true);
      setDetected(null);
      const imageBase64 = dataUrl.split(",")[1];
      try {
        const result = await configService.detectIssueCategoryFromBase64({ imageBase64 });
        if (result && result.label) {
          setValue("category", result.label);
          setDetected({ label: result.label, confidence: result.confidence });
        }
      } catch {
        // non-blocking
      } finally {
        setDetecting(false);
      }
    } catch (err) {
      setError(err.message || "Failed to capture photo");
    } finally {
      stopStream();
    }
  };

  const tryParseLatLng = (loc) => {
    if (!loc) return { lat: undefined, lng: undefined };
    const parts = loc.split(",").map((s) => s.trim());
    if (parts.length !== 2) return { lat: undefined, lng: undefined };
    const parsedLat = Number(parts[0]);
    const parsedLng = Number(parts[1]);
    if (Number.isFinite(parsedLat) && Number.isFinite(parsedLng)) {
      return { lat: parsedLat, lng: parsedLng };
    }
    return { lat: undefined, lng: undefined };
  };

  const submitIssue = async (data) => {
    setError("");
    if (files.length === 0) {
      setError("Upload at least one photo/video");
      return;
    }
    setIsSubmitting(true);
    try {
      // Upload files and get file IDs
      const uploadedFiles = await Promise.all(files.map((f) => configService.uploadFile(f)));
      const fileIds = uploadedFiles.map(file => file.$id);

      let lat = data.lat !== undefined ? Number(data.lat) : undefined;
      let lng = data.lng !== undefined ? Number(data.lng) : undefined;

      if (lat === undefined || lng === undefined) {
        const parsed = tryParseLatLng(location || data.location);
        lat = parsed.lat;
        lng = parsed.lng;
      }

      if (lat === undefined || lng === undefined) {
        throw new Error("Location coordinates not available. Please allow location or enter 'lat, lng' in Location.");
      }

      await configService.createIssue({
        title: data.title,
        description: data.description,
        category: data.category,
        severity: Number(data.severity) || 3,
        urgency: Number(data.urgency) || 60,
        userId: userData.$id,
        lat,
        lng,
        fileIds: fileIds, // Store file IDs with the issue
      });

      setSuccess(true);
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error submitting issue");
    } finally {
      setIsSubmitting(false);
    }
  };
  const openCamera = async () => {
    try {
      setIsLiveDetection(true);
      setDetecting(true);

      const res = await fetch("http://127.0.0.1:8000/Interference/start-webcam/");
      const data = await res.json();

      if (data.status === "started" || data.status === "already_running") {
        console.log("Backend webcam started");

        // Now poll backend for last detected image
        startFetchingFrames();
      }
    } catch (err) {
      console.error("Error starting webcam:", err);
    }
  };
  const startFetchingFrames = () => {
    detectionIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/Interference/get-last-frame/");
        const data = await res.json();
        if (data.detections) {
          setLiveDetections(data.detections);
        }
      } catch (err) {
        console.error("Error fetching frame:", err);
      }
    }, 100);
  };

  const stopStream = async () => {
    await fetch("http://127.0.0.1:8000/Interference/stop-webcam/");

    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    setIsLiveDetection(false);
    setLiveDetections([]);
  };


  return (
    <section className="relative min-h-screen flex items-start justify-center pt-16 md:pt-20 px-4">
      <div className="w-full max-w-5xl bg-[#121212]/80 rounded-3xl p-4 sm:p-6 md:p-8 shadow-lg border border-gray-700">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Report an Issue</h2>
        {success ? (
          <p className="text-green-400">Issue reported successfully!</p>
        ) : (
          <form onSubmit={handleSubmit(submitIssue)} className="space-y-4">
            {error && <p className="text-red-400">{error}</p>}

            <Input label="Issue Title" placeholder="E.g., Pothole near market" darkMode {...register("title", { required: "Title is required" })} />
            {errors.title && <p className="text-red-400">{errors.title.message}</p>}

            <div>
              <label className="text-gray-300">Description</label>
              <textarea {...register("description", { required: "Description is required" })} className="w-full p-2 bg-gray-800 text-white rounded-lg" />
            </div>

            <select {...register("category", { required: "Category is required" })} className="w-full p-2 bg-gray-800 text-white rounded-lg">
              <option value="">Select a category</option>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>

            <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} darkMode {...register("location")} />
            <input type="hidden" {...register("lat")} />
            <input type="hidden" {...register("lng")} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 mb-1">Severity</label>
                <select className="w-full p-2 bg-gray-800 text-white rounded-lg" defaultValue="3" {...register("severity")}>
                  <option value="1">1 - Low</option>
                  <option value="2">2 - Moderate</option>
                  <option value="3">3 - Normal</option>
                  <option value="4">4 - High</option>
                  <option value="5">5 - Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Urgency Level</label>
                <select className="w-full p-2 bg-gray-800 text-white rounded-lg" defaultValue="60" {...register("urgency")}>
                  <option value="20">20% - Low Priority</option>
                  <option value="40">40% - Below Average</option>
                  <option value="60">60% - Normal</option>
                  <option value="80">80% - High Priority</option>
                  <option value="100">100% - Critical</option>
                </select>
              </div>
            </div>

            <div className="flex items-center">
              <label className="inline-flex items-center gap-2 text-gray-300">
                <input type="checkbox" className="w-4 h-4" {...register("isAnonymous")} />
                Report anonymously
              </label>
            </div>

            <div className="space-y-4">
              {/* Two Main Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Open Camera Button */}
                <div className="space-y-2">
                  <label className="block text-gray-300 font-medium text-sm sm:text-base">Live Camera Detection</label>
                  <Button type="button" onClick={openCamera} className="w-full bg-[#045c65] hover:bg-[#067a85] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-lg">
                    📷 Open Camera
                  </Button>
                  <p className="text-xs text-gray-400">Direct connection to trained model camera</p>
                </div>

                {/* Photo Upload */}
                <div className="space-y-2">
                  <label className="block text-gray-300 font-medium text-sm sm:text-base">Upload Photo</label>
                  <input type="file" multiple accept="image/*" capture="environment" onChange={handleFileChange} className="w-full p-2 sm:p-3 bg-gray-800 text-white rounded-lg border border-gray-600 text-sm" />
                  <p className="text-xs text-gray-400">Upload image for detection</p>
                </div>
              </div>

              {/* Camera View */}
              {isLiveDetection && (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <Button type="button" onClick={capturePhoto} className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base">
                      Capture
                    </Button>
                    <Button type="button" onClick={stopStream} className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base">
                      Stop Camera
                    </Button>
                  </div>
                  <div className="relative">
                    <video ref={videoRef} className="w-full max-w-sm sm:max-w-md rounded-lg border border-gray-700" autoPlay playsInline muted />
                    <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Detection Results */}
              {detecting && <span className="text-sm text-yellow-400">🔍 Detecting issues...</span>}
              {detected && (
                <div className="text-sm text-green-400">
                  ✅ Detected: {detected.label} ({Math.round((detected.confidence || 0) * 100)}% confidence)
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {filePreviewUrls.map((url, i) => <img key={i} src={url} alt="preview" className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg" />)}
            </div>

            <Button type="submit" disabled={isSubmitting} className="bg-[#29757c] text-white w-full py-2 rounded-lg">
              {isSubmitting ? "Submitting..." : "Submit Issue"}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}

export default ReportIssue;
