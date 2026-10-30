import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import {
  HiOutlineCamera,
  HiOutlineMapPin,
  HiOutlineFingerPrint,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from 'react-icons/hi2';

const PunchInOut = () => {
  const queryClient = useQueryClient();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const [locationError, setLocationError] = useState(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      toast.error('Camera access denied or unavailable.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => setLocationError(err.message),
        { enableHighAccuracy: true }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser.');
    }
    return () => stopCamera();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (location) {
      const fetchAddress = async () => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${location.lat}&lon=${location.lng}&format=json`
          );
          const data = await res.json();
          if (data && data.display_name) {
            setAddress(data.display_name);
          }
        } catch (error) {
          console.error('Error fetching address', error);
        }
      };
      fetchAddress();
    }
  }, [location]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        setCapturedPhoto(blob);
        stopCamera();
      }, 'image/jpeg');
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  const punchInMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('latitude', location.lat);
      formData.append('longitude', location.lng);
      if (capturedPhoto) {
        formData.append('photo', capturedPhoto, 'punchin.jpg');
      }
      const { data } = await api.post('/attendance/punch-in', formData);
      return data;
    },
    onSuccess: () => {
      toast.success('Punched in successfully!');
      setCapturedPhoto(null);
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
      queryClient.invalidateQueries({ queryKey: ['myAttendanceReport'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to punch out');
    },
  });

  const isCameraActive = !!stream || !!capturedPhoto;

  return (
    <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6">

      {/* ===================== PAGE HEADER ===================== */}
      <div className="text-center">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
          Daily Attendance Terminal
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Geo-verified punch in and punch out for official time logs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

        {/* ===================== ACTION PANEL ===================== */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center gap-4 sm:gap-6">

          {/* Location Box */}
          <div className="text-center w-full bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              <HiOutlineMapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
              Verified Location
            </div>

            {location ? (
              <>
                <p className="text-emerald-700 font-mono text-[11px] sm:text-xs font-bold mb-1 break-all">
                  Lat: {location.lat.toFixed(5)} | Lng: {location.lng.toFixed(5)}
                </p>
                {address && (
                  <p className="text-slate-500 text-[10px] sm:text-[11px] px-1 sm:px-2 line-clamp-2 leading-relaxed">
                    {address}
                  </p>
                )}
              </>
            ) : locationError ? (
              <div className="flex items-center justify-center gap-1.5 text-rose-600 text-[11px] sm:text-xs font-medium">
                <HiOutlineXCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{locationError}</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5 text-slate-400 text-[11px] sm:text-xs">
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
                if (!location) {
                  toast.error('Waiting for GPS coordinates...');
                  return;
                }
                punchInMutation.mutate();
              }}
              disabled={punchInMutation.isPending || !location || !capturedPhoto}
              className="w-full py-3 sm:py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs sm:text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {punchInMutation.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <HiOutlineFingerPrint className="w-4 h-4 sm:w-5 sm:h-5" />
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
              className="w-full py-3 sm:py-3.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl font-bold text-xs sm:text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {punchOutMutation.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <HiOutlineFingerPrint className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>PUNCH OUT (END SHIFT)</span>
                </>
              )}
            </button>
          </div>

          {/* Helper hint (subtle) */}
          {!capturedPhoto && (
            <p className="text-[10px] sm:text-[11px] text-slate-400 text-center leading-relaxed">
              Capture a verification selfie to enable Punch In / Punch Out buttons.
            </p>
          )}
        </div>

        {/* ===================== CAMERA PANEL ===================== */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
              <HiOutlineCamera className="w-3.5 h-3.5" />
            </span>
            Verification Selfie
          </h2>

          <div className="relative w-full aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden mb-3 sm:mb-4 border border-slate-200">
            {!stream && !capturedPhoto && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 px-4">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mb-2">
                  <HiOutlineCamera className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-[11px] sm:text-xs font-medium text-slate-500 text-center">
                  Camera preview inactive
                </p>
                <p className="text-[10px] text-slate-400 text-center mt-0.5">
                  Click &quot;Start Camera&quot; below
                </p>
              </div>
            )}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${capturedPhoto ? 'hidden' : 'block'}`}
            />

            <canvas ref={canvasRef} className="hidden" />

            {capturedPhoto && (
              <img
                src={URL.createObjectURL(capturedPhoto)}
                alt="Captured selfie"
                className="w-full h-full object-cover"
              />
            )}

            {/* Live / Captured indicator */}
            {isCameraActive && (
              <span
                className={`absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${capturedPhoto
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${capturedPhoto ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'
                    }`}
                />
                {capturedPhoto ? 'Captured' : 'Live'}
              </span>
            )}
          </div>

          {!capturedPhoto ? (
            <div className="flex gap-2 w-full">
              {!stream ? (
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-sm cursor-pointer"
                >
                  <HiOutlineCamera className="w-3.5 h-3.5" />
                  Start Camera
                </button>
              ) : (
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-sm cursor-pointer"
                >
                  <HiOutlineCamera className="w-3.5 h-3.5" />
                  Take Snapshot
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={retakePhoto}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-sm cursor-pointer"
            >
              <HiOutlineCheckCircle className="w-3.5 h-3.5" />
              Retake Photo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PunchInOut;