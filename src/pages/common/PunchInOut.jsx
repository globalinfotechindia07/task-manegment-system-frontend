import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { HiOutlineCamera, HiOutlineMapPin, HiOutlineFingerPrint } from 'react-icons/hi2';

const PunchInOut = () => {
  const queryClient = useQueryClient();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);
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

  useEffect(() => {
    if (location) {
      const fetchAddress = async () => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${location.lat}&lon=${location.lng}&format=json`);
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
    }
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
    }
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Daily Attendance Terminal</h1>
        <p className="text-sm text-slate-500 mt-1">Geo-verified punch in and punch out for official time logs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Action Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-center items-center gap-6">
          <div className="text-center w-full bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              <HiOutlineMapPin className="w-4 h-4 text-indigo-600" />
              Verified Location
            </div>
            {location ? (
              <>
                <p className="text-emerald-700 font-mono text-xs font-bold mb-1">Lat: {location.lat.toFixed(5)} | Lng: {location.lng.toFixed(5)}</p>
                {address && <p className="text-slate-500 text-[11px] px-2 line-clamp-2">{address}</p>}
              </>
            ) : locationError ? (
              <p className="text-rose-600 text-xs font-medium">{locationError}</p>
            ) : (
              <p className="text-slate-400 animate-pulse text-xs">Acquiring GPS coordinates...</p>
            )}
          </div>

          <div className="w-full space-y-3">
            <button 
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
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-xs disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <HiOutlineFingerPrint className="w-5 h-5" />
              {punchInMutation.isPending ? 'Processing...' : 'PUNCH IN (WORK SHIFT)'}
            </button>

            <button 
              onClick={() => {
                if (!capturedPhoto) {
                  toast.error('Please capture verification selfie first.');
                  return;
                }
                punchOutMutation.mutate();
              }}
              disabled={punchOutMutation.isPending || !capturedPhoto}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm shadow-xs disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <HiOutlineFingerPrint className="w-5 h-5" />
              {punchOutMutation.isPending ? 'Processing...' : 'PUNCH OUT (END SHIFT)'}
            </button>
          </div>
        </div>

        {/* Camera Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <HiOutlineCamera className="w-4 h-4 text-indigo-600" />
            Verification Selfie
          </h2>
          
          <div className="relative w-full aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden mb-4 border border-slate-200">
            {!stream && !capturedPhoto && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                <HiOutlineCamera className="w-10 h-10 mb-2 text-slate-300" />
                <p className="text-xs font-medium text-slate-500">Camera preview inactive</p>
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
            <div className="flex gap-2 w-full">
              {!stream ? (
                <button 
                  onClick={startCamera} 
                  className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors shadow-xs"
                >
                  Start Camera
                </button>
              ) : (
                <button 
                  onClick={capturePhoto} 
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                >
                  Take Snapshot
                </button>
              )}
            </div>
          ) : (
            <button 
              onClick={retakePhoto} 
              className="w-full py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors shadow-xs"
            >
              Retake Photo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PunchInOut;
