import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import { HiOutlineMapPin } from 'react-icons/hi2';
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
            setValue('officeAddress', data.display_name, { shouldDirty: true });
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
    
    // officeAddress is naturally a string, it will be included in data
    
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
    return <div className="text-center p-10"><div className="animate-spin inline-block w-8 h-8 border-4 rounded-full border-indigo-600 border-t-transparent"></div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Attendance Policy Settings</h1>
        <p className="text-sm text-slate-500">Configure global office timings, geofencing, and late mark policies.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8 space-y-8">
          
          {/* Geofencing Section */}
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">Location & Geofencing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Office Latitude</label>
                <input type="number" step="any" {...register('officeLatitude', { required: true })} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Office Longitude</label>
                <input type="number" step="any" {...register('officeLongitude', { required: true })} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
              </div>
              <div className="md:col-span-2">
                <button type="button" onClick={handleGetCurrentLocation} className="text-sm font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-4 py-2 rounded-lg transition-colors">
                  Use My Current Location
                </button>
              </div>

              {/* Display Address & Map */}
              <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <HiOutlineMapPin className="w-5 h-5 text-indigo-600" />
                  Exact Location View
                </label>
                
                {lat && lng ? (
                  <div className="space-y-4">
                    <div className="w-full h-64 rounded-lg overflow-hidden border border-slate-200 bg-white">
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
                    <div className="text-slate-800 text-sm w-full">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Editable Address Label</label>
                      <div className="relative">
                        <textarea 
                          {...register('officeAddress')} 
                          rows={2}
                          className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none text-sm"
                          placeholder="Address will auto-fetch or you can enter manually..."
                        />
                        {isFetchingAddress && (
                          <div className="absolute right-3 top-3">
                            <span className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin block"></span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 text-sm italic py-4 text-center bg-white rounded-lg border border-dashed border-slate-300">
                    Enter latitude and longitude to see the exact map location
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Allowed Radius (Meters)</label>
                <input type="number" {...register('allowedRadiusMeters', { required: true, min: 10 })} className="w-full max-w-md bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                <p className="text-xs text-slate-500 mt-1">Maximum distance an employee can be from the office to punch in.</p>
              </div>
            </div>
          </div>

          {/* Timings Section */}
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">Office Timings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Punch In Time</label>
                <input type="time" {...register('inTime', { required: true })} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Punch Out Time</label>
                <input type="time" {...register('outTime', { required: true })} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Buffer Time (Minutes)</label>
                <input type="number" {...register('bufferMinutes', { required: true, min: 0 })} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                <p className="text-xs text-slate-500 mt-1">Grace period before marking as late (e.g., 15 mins).</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Allowed Late Marks</label>
                <input type="number" {...register('allowedLateMarks', { required: true, min: 0 })} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                <p className="text-xs text-slate-500 mt-1">Number of late arrivals allowed before salary deduction.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-xs disabled:opacity-50 text-sm"
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
