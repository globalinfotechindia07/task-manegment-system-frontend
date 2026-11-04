import { useState, useRef, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import {
  HiOutlineCamera,
  HiOutlineMapPin,
  HiOutlineFingerPrint,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineArrowPath,
  HiOutlineInformationCircle,
  HiOutlineDevicePhoneMobile,
  HiOutlineVideoCamera,
} from 'react-icons/hi2';

const PunchInOut = () => {
  const queryClient = useQueryClient();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Camera & Photo State
  const [stream, setStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
  const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);

  // Location State
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isAcquiringLocation, setIsAcquiringLocation] = useState(false);

  // Detect insecure HTTP origin on mobile
  const isInsecureContext =
    typeof window !== 'undefined' &&
    !window.isSecureContext &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1';

  // ===================== LOCATION LOGIC =====================
  // Fallback to IP Network Geolocation if browser GPS is blocked on mobile HTTP
  const fetchIpLocationFallback = useCallback(async (browserErrMsg = '') => {
    try {
      // Free HTTPS network geolocation
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      if (data && data.latitude && data.longitude) {
        setLocation({
          lat: data.latitude,
          lng: data.longitude,
          isApproximate: true,
        });
        setAddress(
          `${data.city || 'Local Area'}, ${data.region || ''}, ${data.country_name || 'India'} (Network Location)`
        );
        setLocationError(null);
        toast.success('Acquired network location.');
        return;
      }
    } catch {
      // If ipapi fails, try alternative ipwhois
      try {
        const res2 = await fetch('https://ipwho.is/');
        const data2 = await res2.json();
        if (data2 && data2.latitude && data2.longitude) {
          setLocation({
            lat: data2.latitude,
            lng: data2.longitude,
            isApproximate: true,
          });
          setAddress(
            `${data2.city || 'Local Area'}, ${data2.region || ''}, ${data2.country || 'India'} (Network Location)`
          );
          setLocationError(null);
          return;
        }
      } catch {
        // Silently continue
      }
    }

    setLocationError(
      browserErrMsg ||
        'Location access restricted by mobile browser on HTTP. Please tap "Retry GPS" or enable location.'
    );
  }, []);

  const requestLocation = useCallback(() => {
    setIsAcquiringLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setIsAcquiringLocation(false);
      fetchIpLocationFallback('Geolocation is not supported by this browser.');
      return;
    }

    // Step 1: Attempt High Accuracy GPS (with 6s timeout)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          isApproximate: false,
        });
        setLocationError(null);
        setIsAcquiringLocation(false);
      },
      (err) => {
        // Step 2: Fallback to Low Accuracy (faster on mobile Wi-Fi / cell towers)
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocation({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              isApproximate: false,
            });
            setLocationError(null);
            setIsAcquiringLocation(false);
          },
          (err2) => {
            setIsAcquiringLocation(false);
            // Step 3: Fallback to IP location so mobile users over HTTP are not blocked
            fetchIpLocationFallback(err2.message || err.message);
          },
          { enableHighAccuracy: false, timeout: 8000 }
        );
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
    );
  }, [fetchIpLocationFallback]);

  // Reverse Geocoding for readable address
  useEffect(() => {
    if (location && !location.isApproximate) {
      const fetchAddress = async () => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${location.lat}&lon=${location.lng}&format=json`
          );
          const data = await res.json();
          if (data && data.display_name) {
            setAddress(data.display_name);
          }
        } catch {
          // If Nominatim fails, show coordinates cleanly
          setAddress(`Coordinates: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
        }
      };
      fetchAddress();
    }
  }, [location]);

  // ===================== CAMERA LOGIC =====================
  const stopCameraStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsLiveCameraActive(false);
  }, [stream]);

  // Start Live Webcam Stream (Desktop or Supported Mobile Browsers)
  const startLiveCamera = async () => {
    // Check if mediaDevices API is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // Insecure HTTP origin on mobile blocks WebRTC mediaDevices. Fallback to native camera input!
      toast.info('Live video stream restricted on HTTP. Opening phone camera...');
      triggerNativeCamera();
      return;
    }

    try {
      stopCameraStream();

      // Flexible constraints for broad device compatibility
      let mediaStream = null;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'user' }, width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
      } catch {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false,
          });
        } catch {
          mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
      }

      setStream(mediaStream);
      setIsLiveCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch {
      // If permission is denied or device camera is blocked, automatically open native mobile camera!
      toast.info('Opening device selfie camera...');
      triggerNativeCamera();
    }
  };

  // Trigger Native Phone Camera (100% works on Mobile over HTTP without HTTPS)
  const triggerNativeCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file capture from phone camera input
  const handlePhotoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCapturedPhoto(file);
    const preview = URL.createObjectURL(file);
    setPhotoPreviewUrl(preview);
    stopCameraStream();
    toast.success('Selfie captured successfully!');

    // Reset input value so user can re-capture if needed
    e.target.value = '';
  };

  // Capture snapshot from Live Webcam Stream
  const captureSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            setCapturedPhoto(blob);
            setPhotoPreviewUrl(canvas.toDataURL('image/jpeg'));
            stopCameraStream();
            toast.success('Snapshot captured!');
          }
        },
        'image/jpeg',
        0.85
      );
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setPhotoPreviewUrl(null);
    // On mobile or HTTP, re-open native camera; otherwise re-start live camera
    if (isInsecureContext || !navigator.mediaDevices?.getUserMedia) {
      triggerNativeCamera();
    } else {
      startLiveCamera();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    requestLocation();
    return () => {
      stopCameraStream();
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, []);

  // ===================== PUNCH IN / OUT MUTATIONS =====================
  const punchInMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      if (location) {
        formData.append('latitude', location.lat);
        formData.append('longitude', location.lng);
      }
      if (capturedPhoto) {
        formData.append('photo', capturedPhoto, 'punchin.jpg');
      }
      const { data } = await api.post('/attendance/punch-in', formData);
      return data;
    },
    onSuccess: () => {
      toast.success('Punched in successfully!');
      setCapturedPhoto(null);
      setPhotoPreviewUrl(null);
      queryClient.invalidateQueries({ queryKey: ['myAttendanceReport'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to punch in');
    },
  });

  const punchOutMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      if (location) {
        formData.append('latitude', location.lat);
        formData.append('longitude', location.lng);
      }
      if (capturedPhoto) {
        formData.append('photo', capturedPhoto, 'punchout.jpg');
      }
      const { data } = await api.post('/attendance/punch-out', formData);
      return data;
    },
    onSuccess: () => {
      toast.success('Punched out successfully!');
      setCapturedPhoto(null);
      setPhotoPreviewUrl(null);
      queryClient.invalidateQueries({ queryKey: ['myAttendanceReport'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to punch out');
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6 pb-12">
      {/* Hidden Native Phone Camera Input (Works 100% on Mobile HTTP) */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handlePhotoFileChange}
      />

      {/* ===================== PAGE HEADER ===================== */}
      <div className="text-center">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
          Daily Attendance Terminal
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Geo-verified punch in and punch out for official staff attendance logs.
        </p>
      </div>

      {/* ===================== MOBILE INSECURE CONTEXT HELPER NOTICE ===================== */}
      {isInsecureContext && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5 shadow-2xs">
          <HiOutlineInformationCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">Mobile Browser Notice:</span>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              When accessing over a local Wi-Fi IP address (HTTP), Chrome requires using the native camera.
              Tap <strong className="font-bold">&quot;Take Selfie with Phone Camera&quot;</strong> below to take your verification photo instantly!
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-start">
        {/* ===================== ACTION PANEL ===================== */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-center items-center gap-4 sm:gap-6">
          {/* Location Box */}
          <div className="text-center w-full bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <HiOutlineMapPin className="w-4 h-4 text-indigo-600" />
                Verified GPS Location
              </span>

              <button
                type="button"
                onClick={requestLocation}
                disabled={isAcquiringLocation}
                className="text-[10px] lowercase tracking-normal font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                title="Refresh location coordinates"
              >
                <HiOutlineArrowPath
                  className={`w-3.5 h-3.5 ${isAcquiringLocation ? 'animate-spin' : ''}`}
                />
                <span>Retry GPS</span>
              </button>
            </div>

            {location ? (
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <p className="text-emerald-700 font-mono text-xs font-bold break-all">
                    Lat: {location.lat.toFixed(5)} | Lng: {location.lng.toFixed(5)}
                  </p>
                </div>
                {address && (
                  <p className="text-slate-500 text-[11px] px-1 sm:px-2 line-clamp-2 leading-relaxed">
                    {address}
                  </p>
                )}
                {location.isApproximate && (
                  <span className="inline-block text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 mt-1">
                    Network Location (Browser GPS restricted on HTTP)
                  </span>
                )}
              </div>
            ) : locationError ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-rose-600 text-xs font-medium">
                  <HiOutlineXCircle className="w-4 h-4 shrink-0" />
                  <span className="line-clamp-2">{locationError}</span>
                </div>
                <button
                  type="button"
                  onClick={requestLocation}
                  className="px-3 py-1 bg-white border border-slate-300 rounded-md text-[11px] font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs"
                >
                  Retry Location Permission
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs py-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span>Acquiring GPS coordinates...</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-2.5 sm:space-y-3">
            <button
              type="button"
              onClick={() => {
                if (!capturedPhoto) {
                  toast.error('Please capture verification selfie first.');
                  return;
                }
                punchInMutation.mutate();
              }}
              disabled={punchInMutation.isPending || !capturedPhoto}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs sm:text-sm shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {punchInMutation.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing Punch In...</span>
                </>
              ) : (
                <>
                  <HiOutlineFingerPrint className="w-5 h-5" />
                  <span>PUNCH IN (WORK SHIFT)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                if (!capturedPhoto) {
                  toast.error('Please capture verification selfie first.');
                  return;
                }
                punchOutMutation.mutate();
              }}
              disabled={punchOutMutation.isPending || !capturedPhoto}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl font-bold text-xs sm:text-sm shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {punchOutMutation.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing Punch Out...</span>
                </>
              ) : (
                <>
                  <HiOutlineFingerPrint className="w-5 h-5" />
                  <span>PUNCH OUT (END SHIFT)</span>
                </>
              )}
            </button>
          </div>

          {/* Helper hint */}
          {!capturedPhoto ? (
            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              Capture a selfie photo using your camera to enable the punch in/out buttons.
            </p>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <HiOutlineCheckCircle className="w-4 h-4" />
              <span>Selfie verified! You can now punch in/out.</span>
            </div>
          )}
        </div>

        {/* ===================== CAMERA PANEL ===================== */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-3">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                <HiOutlineCamera className="w-3.5 h-3.5" />
              </span>
              Verification Selfie
            </h2>

            {capturedPhoto ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Captured
              </span>
            ) : isLiveCameraActive ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                Live Video
              </span>
            ) : null}
          </div>

          {/* Video Preview / Image Canvas */}
          <div className="relative w-full aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden mb-3.5 border border-slate-200 flex items-center justify-center">
            {/* 1. Inactive State Placeholder */}
            {!isLiveCameraActive && !photoPreviewUrl && (
              <div className="flex flex-col items-center justify-center text-slate-400 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mb-2">
                  <HiOutlineCamera className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-xs font-semibold text-slate-600">Camera preview inactive</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tap &quot;Open Phone Camera&quot; or &quot;Start Live Camera&quot; below
                </p>
              </div>
            )}

            {/* 2. Live Webcam Stream */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${
                isLiveCameraActive && !photoPreviewUrl ? 'block' : 'hidden'
              }`}
            />

            <canvas ref={canvasRef} className="hidden" />

            {/* 3. Captured Photo Preview */}
            {photoPreviewUrl && (
              <img
                src={photoPreviewUrl}
                alt="Verification selfie"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Camera Buttons Controls */}
          <div className="w-full space-y-2">
            {!photoPreviewUrl ? (
              <>
                {/* Primary Button: Open Device Camera (Universal on Mobile & Desktop) */}
                <button
                  type="button"
                  onClick={triggerNativeCamera}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-2xs cursor-pointer"
                >
                  <HiOutlineDevicePhoneMobile className="w-4 h-4" />
                  <span>Take Selfie with Phone Camera</span>
                </button>

                {/* Secondary Button: Live Webcam Preview (if browser supports WebRTC) */}
                {!isLiveCameraActive ? (
                  <button
                    type="button"
                    onClick={startLiveCamera}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                  >
                    <HiOutlineVideoCamera className="w-4 h-4 text-slate-500" />
                    <span>Start Live Webcam Preview</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={captureSnapshot}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
                  >
                    <HiOutlineCamera className="w-4 h-4" />
                    <span>Take Snapshot from Stream</span>
                  </button>
                )}
              </>
            ) : (
              /* Retake Photo Button */
              <div className="flex gap-2 w-full">
                <button
                  type="button"
                  onClick={retakePhoto}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                >
                  <HiOutlineArrowPath className="w-4 h-4 text-slate-500" />
                  <span>Retake Selfie Photo</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PunchInOut;
