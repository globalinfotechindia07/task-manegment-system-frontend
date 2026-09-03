import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const PunchInOut = () => {
  const queryClient = useQueryClient();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // Initialize Camera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
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
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    // Get location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => setLocationError(err.message),
        { enableHighAccuracy: true }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser.");
    }
    return () => stopCamera();
    // eslint-disable-next-line
  }, []);

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
    }
  });

  const punchOutMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/attendance/punch-out');
      return data;
    },
    onSuccess: () => {
      toast.success('Punched out successfully!');
      queryClient.invalidateQueries({ queryKey: ['myAttendanceReport'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to punch out');
    }
  });

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in zoom-in-95 duration-200">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Daily Attendance</h1>
        <p className="text-slate-400">Mark your attendance. Ensure you are within office premises.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Action Panel */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-center items-center gap-6">
          
          <div className="text-center">
            <h2 className="text-lg font-semibold text-slate-300 mb-1">Your Location</h2>
            {location ? (
              <p className="text-emerald-400 font-mono text-sm">Lat: {location.lat.toFixed(6)} | Lng: {location.lng.toFixed(6)}</p>
            ) : locationError ? (
              <p className="text-red-400 text-sm">{locationError}</p>
            ) : (
              <p className="text-slate-500 animate-pulse text-sm">Fetching location...</p>
            )}
          </div>

          <button 
            onClick={() => {
              if (!capturedPhoto) {
                toast.error('Please capture a photo first.');
                return;
              }
              if (!location) {
                toast.error('Waiting for location...');
                return;
              }
              punchInMutation.mutate();
            }}
            disabled={punchInMutation.isPending || !location || !capturedPhoto}
            className="w-full max-w-xs py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 transition-all"
          >
            {punchInMutation.isPending ? 'Processing...' : 'PUNCH IN'}
          </button>

          <button 
            onClick={() => punchOutMutation.mutate()}
            disabled={punchOutMutation.isPending}
            className="w-full max-w-xs py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(225,29,72,0.3)] disabled:opacity-50 transition-all"
          >
            {punchOutMutation.isPending ? 'Processing...' : 'PUNCH OUT'}
          </button>
        </div>

        {/* Camera Panel */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col items-center">
          <h2 className="text-lg font-semibold text-slate-300 mb-4">Verification Selfie</h2>
          
          <div className="relative w-full aspect-[4/3] bg-slate-800 rounded-xl overflow-hidden mb-4 border border-slate-700">
            {!stream && !capturedPhoto && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p>Camera is off</p>
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
                alt="Captured" 
                className="w-full h-full object-cover" 
              />
            )}
          </div>

          {!capturedPhoto ? (
            <div className="flex gap-3 w-full">
              {!stream ? (
                <button onClick={startCamera} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium">
                  Turn On Camera
                </button>
              ) : (
                <button onClick={capturePhoto} className="flex-1 py-2 bg-white text-slate-900 hover:bg-slate-200 rounded-lg transition-colors font-bold">
                  Capture Photo
                </button>
              )}
            </div>
          ) : (
            <button onClick={retakePhoto} className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium">
              Retake Photo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PunchInOut;
