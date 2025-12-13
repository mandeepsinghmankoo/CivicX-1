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
  const [backendPreviewUrls, setBackendPreviewUrls] = useState([]);
  const [useBackendCamera, setUseBackendCamera] = useState(false);
  const backendStartedRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState(null);
  const [liveDetections, setLiveDetections] = useState([]);
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
      navigate("/");
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
        () => {}
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
    
    if (selected.length > 0) {
      const imageFiles = selected.filter(f => f.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        setDetecting(true);
        setDetected(null);
        
        try {
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

  const stopStream = () => {
    // Stop frontend webcam
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    
    // Stop detection interval
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    
    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsLiveDetection(false);
    setLiveDetections([]);
    setDetected(null);
    setError("");
    
    // Stop backend camera service if we started it
    if (useBackendCamera && backendStartedRef.current) {
      fetch('http://127.0.0.1:8000/Interference/stop-webcam/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }).catch(err => console.log('Error stopping backend service:', err));
      backendStartedRef.current = false;
    }

    // Fetch previews saved by backend and show them
    fetch('http://127.0.0.1:8000/Interference/previews/')
      .then(r => r.json())
      .then(data => {
        if (data && Array.isArray(data.previews)) {
          setBackendPreviewUrls(data.previews);
        }
      })
      .catch(err => console.log('Error fetching previews:', err));

    console.log("Camera stopped");
  };

  const openCamera = async () => {
    try {
      // If we're not using the backend camera, ensure any server webcam is stopped first
      if (!useBackendCamera) {
        try {
          // This should call the stop endpoint so the server doesn't hold the physical camera
          await fetch('http://127.0.0.1:8000/Interference/stop-webcam/', { method: 'POST' });
          backendStartedRef.current = false;
          console.log('Requested backend to stop before opening local camera');
        } catch (stopErr) {
          console.warn('Could not stop backend webcam before opening local camera:', stopErr);
        }
      }
      // If user asked to use the server camera, don't open local browser camera
      if (useBackendCamera) {
        // Start server camera service
        try {
          console.log("Starting backend camera service...");
          const response = await fetch('http://127.0.0.1:8000/Interference/start-webcam/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const text = await response.text().catch(() => null);
            console.error('Failed to start backend camera, status:', response.status, 'body:', text);
            throw new Error(`HTTP ${response.status}`);
          }

          const result = await response.json().catch(() => null);
          console.log('Backend camera started successfully:', result);
          backendStartedRef.current = true;
          setIsLiveDetection(true);
          setError("");

          // Start polling previews and latest detection every 2s
          detectionIntervalRef.current = setInterval(async () => {
            try {
              // fetch previews
              const previewsResp = await fetch('http://127.0.0.1:8000/Interference/previews/');
              if (previewsResp.ok) {
                const previewsData = await previewsResp.json();
                if (previewsData && Array.isArray(previewsData.previews)) {
                  setBackendPreviewUrls(previewsData.previews);
                }
              }

              // fetch latest detection
              const latestResp = await fetch('http://127.0.0.1:8000/Interference/latest-detection/');
              if (latestResp.ok) {
                const latestData = await latestResp.json();
                if (latestData && latestData.latest) {
                  const predicted = latestData.latest.class_detected;
                  if (predicted) {
                    setValue("category", predicted);
                    setDetected({ label: predicted, confidence: null });
                    setError(`✅ Detected (server): ${predicted}`);
                    setLiveDetections([{
                      label: predicted,
                      confidence: null,
                      x: 20, y: 20, w: 320, h: 240
                    }]);
                  }
                }
              }
            } catch (err) {
              console.log('Backend polling error:', err);
            }
          }, 2000);

        } catch (err) {
          console.error('Error starting backend camera:', err);
          setError(`Failed to start backend camera: ${err && err.message ? err.message : String(err)}`);
        }

        return; // done - do not open local camera
      }

      // First, start the local webcam for preview
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 720 },
          height: { ideal: 1280 }
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        await videoRef.current.play();
      }

      setIsLiveDetection(true);
      setError("");

      // Try to start backend camera only if requested (rare path when both are allowed)
      if (useBackendCamera) {
        try {
          console.log("Starting backend camera service...");
          const response = await fetch('http://127.0.0.1:8000/Interference/start-webcam/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const text = await response.text().catch(() => null);
            console.error('Failed to start backend camera, status:', response.status, 'body:', text);
            throw new Error(`HTTP ${response.status}`);
          }

          const result = await response.json().catch(() => null);
          console.log('Backend camera started successfully:', result);
          backendStartedRef.current = true;
        } catch (err) {
          console.error('Error starting backend camera:', err);
          setError(`Failed to start backend camera: ${err && err.message ? err.message : String(err)}`);
        }
      }

        // Start sending frames to backend every 2 seconds (local camera mode)
      detectionIntervalRef.current = setInterval(async () => {
          if (!videoRef.current || !isLiveDetection || !streamRef.current) return;
          
          try {
            // Capture current frame
            const canvas = document.createElement('canvas');
            const video = videoRef.current;
            canvas.width = video.videoWidth || 720;
            canvas.height = video.videoHeight || 1280;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convert to blob for FormData
            canvas.toBlob(async (blob) => {
              if (!blob) return;
              
              const formData = new FormData();
              formData.append('image', blob, 'capture.jpg');
              
              try {
                // Send to Django for classification
                const detectionResponse = await fetch('http://127.0.0.1:8000/Interference/classify_image/', {
                  method: 'POST',
                  body: formData,
                });
                
                if (detectionResponse.ok) {
                  const detectionResult = await detectionResponse.json();
                  console.log('Detection result:', detectionResult);
                  
                  if (detectionResult.predicted_class) {
                    // Update the category dropdown
                    setValue("category", detectionResult.predicted_class);
                    // Use actual confidence from backend, or default to 1.0 if not provided
                    const confidence = detectionResult.confidence || 1.0;
                    setDetected({ 
                      label: detectionResult.predicted_class, 
                      confidence: confidence 
                    });
                    
                    // Visual feedback - show bounding box around entire frame
                    setLiveDetections([{
                      label: detectionResult.predicted_class,
                      confidence: confidence,
                      x: 20,
                      y: 20,
                      w: canvas.width - 40,
                      h: canvas.height - 40
                    }]);
                    
                    // Update UI message
                    setError(`✅ Detected: ${detectionResult.predicted_class}`);
                  }
                } else {
                  // Try to log server returned message for debugging
                  const text = await detectionResponse.text().catch(() => null);
                  console.warn('Server classify_image not OK:', detectionResponse.status, text);
                }
              } catch (fetchErr) {
                console.log('Fetch error:', fetchErr);
              }
            }, 'image/jpeg', 0.8);
            
          } catch (frameErr) {
            console.log('Frame capture error:', frameErr);
          }
        }, 2000); // Send frame every 2 seconds

    } catch (cameraErr) {
      console.error('Camera access error:', cameraErr);
      // Show detailed browser error for easier debugging
      const errMsg = cameraErr && cameraErr.name ? `${cameraErr.name}: ${cameraErr.message || ''}` : String(cameraErr);
      setError(`Camera access error - ${errMsg}`);
      setIsLiveDetection(false);
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
        const { x, y, w, h, label } = detection;
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        
        ctx.fillStyle = "#00ff00";
        ctx.font = "14px Arial";
        ctx.fillText(`${label}`, x, y - 5);
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
        fileIds: fileIds,
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
                  <div className="flex items-center gap-3">
                    <Button type="button" onClick={openCamera} className="flex-1 bg-[#045c65] hover:bg-[#067a85] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-lg">
                      📷 Open Camera
                    </Button>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-300">
                      <input type="checkbox" className="w-4 h-4" checked={useBackendCamera} onChange={(e) => setUseBackendCamera(e.target.checked)} />
                      <span className="text-xs">Use server camera</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-400">Direct connection to trained model camera</p>
                  {backendPreviewUrls.length > 0 && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {backendPreviewUrls.slice(0,6).map((u, idx) => (
                        <img key={idx} src={u} alt={`preview-${idx}`} className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-md border border-gray-600" />
                      ))}
                    </div>
                  )}
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
                    {useBackendCamera ? (
                      <div>
                        {/* Show latest preview image saved by backend */}
                        {backendPreviewUrls.length > 0 ? (
                          <img src={backendPreviewUrls[0]} alt="server-preview" className="w-full max-w-sm sm:max-w-md rounded-lg border border-gray-700 object-cover" />
                        ) : (
                          <div className="w-full max-w-sm sm:max-w-md h-64 flex items-center justify-center border border-gray-700 rounded-lg text-gray-400">Waiting for server preview...</div>
                        )}
                      </div>
                    ) : (
                      <video ref={videoRef} className="w-full max-w-sm sm:max-w-md rounded-lg border border-gray-700" autoPlay playsInline muted />
                    )}
                    <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Detection Results */}
              {detecting && <span className="text-sm text-yellow-400">🔍 Detecting issues...</span>}
              {detected && (
                <div className="text-sm text-green-400">
                  ✅ Detected: {detected.label}
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