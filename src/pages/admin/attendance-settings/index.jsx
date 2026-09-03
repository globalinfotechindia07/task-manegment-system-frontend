import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../../api/axios';

const AttendanceSettings = () => {
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, control, setValue } = useForm();
  
  const [address, setAddress] = useState('');
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);

  const lat = useWatch({ control, name: 'officeLatitude' });
  const lng = useWatch({ control, name: 'officeLongitude' });

  useEffect(() => {
    const fetchAddress = async () => {
      if (lat && lng) {
        setIsFetchingAddress(true);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          if (data && data.display_name) {
            setAddress(data.display_name);
          } else {
            setAddress('Address not found');
          }
        } catch (error) {
          setAddress('Error fetching address');
        } finally {
          setIsFetchingAddress(false);
        }
      } else {
        setAddress('');
      }
    };

    const timeoutId = setTimeout(() => {
      fetchAddress();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [lat, lng]);

  const { data: policy, isLoading } = useQuery({
    queryKey: ['attendancePolicy'],
    queryFn: async () => {
      const { data } = await api.get('/attendance/policy');
      reset(data); // populate form
      return data;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (formData) => {
      const { data } = await api.put('/attendance/policy', formData);
      return data;
    },
    onSuccess: () => {
      toast.success('Attendance policy updated successfully');
      queryClient.invalidateQueries({ queryKey: ['attendancePolicy'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update policy');
    }
  });

  const onSubmit = (data) => {
    // Format coordinates to number
    data.officeLatitude = parseFloat(data.officeLatitude);
    data.officeLongitude = parseFloat(data.officeLongitude);
    data.allowedRadiusMeters = parseInt(data.allowedRadiusMeters);
    data.bufferMinutes = parseInt(data.bufferMinutes);
    data.allowedLateMarks = parseInt(data.allowedLateMarks);
    
    updateMutation.mutate(data);
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        reset((formValues) => ({
          ...formValues,
          officeLatitude: position.coords.latitude,
          officeLongitude: position.coords.longitude
        }));
        toast.success('Current location fetched');
      }, (err) => {
        toast.error('Failed to get location: ' + err.message);
      });
    } else {
      toast.error('Geolocation is not supported by this browser.');
    }
  };

  if (isLoading) {
    return <div className="text-center p-10"><div className="animate-spin inline-block w-8 h-8 border-4 rounded-full border-indigo-500 border-t-transparent"></div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-200">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Attendance Policy Settings</h1>
        <p className="text-slate-400">Configure global office timings, geofencing, and late mark policies.</p>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8 space-y-8">
          
          {/* Geofencing Section */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 border-b border-slate-700 pb-2">Location & Geofencing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Office Latitude</label>
                <input type="number" step="any" {...register('officeLatitude', { required: true })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Office Longitude</label>
                <input type="number" step="any" {...register('officeLongitude', { required: true })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none" />
              </div>
              <div className="md:col-span-2">
                <button type="button" onClick={handleGetCurrentLocation} className="text-sm bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 px-4 py-2 rounded-lg transition-colors">
                  Use My Current Location
                </button>
              </div>

              {/* Display Address & Map */}
              <div className="md:col-span-2 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <label className="block text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Exact Location View
                </label>
                
                {lat && lng ? (
                  <div className="space-y-4">
                    <div className="w-full h-64 rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
                      <iframe 
                        title="Map View"
                        width="100%" 
                        height="100%" 
                        style={{ border: 0 }} 
                        loading="lazy" 
                        allowFullScreen 
                        src={`https://maps.google.com/maps?q=${lat},${lng}&t=&z=17&ie=UTF8&iwloc=&output=embed`}
                      ></iframe>
                    </div>
                    <div className="text-slate-200 text-sm">
                      {isFetchingAddress ? (
                        <span className="flex items-center gap-2 text-slate-400 animate-pulse">
                          <span className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></span>
                          Fetching address text...
                        </span>
                      ) : address ? (
                        <span className="font-medium text-slate-300">{address}</span>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 text-sm italic py-4 text-center bg-slate-900/50 rounded-lg border border-dashed border-slate-700">
                    Enter latitude and longitude to see the exact map location
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">Allowed Radius (Meters)</label>
                <input type="number" {...register('allowedRadiusMeters', { required: true, min: 10 })} className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none" />
                <p className="text-xs text-slate-500 mt-1">Maximum distance an employee can be from the office to punch in.</p>
              </div>
            </div>
          </div>

          {/* Timings Section */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 border-b border-slate-700 pb-2">Office Timings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Punch In Time</label>
                <input type="time" {...register('inTime', { required: true })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Punch Out Time</label>
                <input type="time" {...register('outTime', { required: true })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Buffer Time (Minutes)</label>
                <input type="number" {...register('bufferMinutes', { required: true, min: 0 })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none" />
                <p className="text-xs text-slate-500 mt-1">Grace period before marking as late (e.g., 15 mins).</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Allowed Late Marks</label>
                <input type="number" {...register('allowedLateMarks', { required: true, min: 0 })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none" />
                <p className="text-xs text-slate-500 mt-1">Number of late arrivals allowed before salary deduction.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AttendanceSettings;
