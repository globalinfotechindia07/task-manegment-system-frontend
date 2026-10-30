import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import { HiOutlineMapPin, HiOutlineClock, HiOutlineGlobeAsiaAustralia } from 'react-icons/hi2';
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
      reset(data);
      return data;
    },
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
    },
  });

  const onSubmit = (data) => {
    data.officeLatitude = parseFloat(data.officeLatitude);
    data.officeLongitude = parseFloat(data.officeLongitude);
    data.allowedRadiusMeters = parseInt(data.allowedRadiusMeters);
    data.bufferMinutes = parseInt(data.bufferMinutes);
    data.allowedLateMarks = parseInt(data.allowedLateMarks);

    updateMutation.mutate(data);
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          reset((formValues) => ({
            ...formValues,
            officeLatitude: position.coords.latitude,
            officeLongitude: position.coords.longitude,
          }));
          toast.success('Current location fetched');
        },
        (err) => {
          toast.error('Failed to get location: ' + err.message);
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser.');
    }
  };

  // Reusable classes
  const inputBase =
    'w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors';
  const labelBase = 'block text-xs font-semibold text-slate-700 mb-1.5';
  const hintBase = 'text-[11px] text-slate-500 mt-1 leading-relaxed';

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="w-8 h-8 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6">

      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Attendance Policy Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure global office timings, geofencing, and late mark policies.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 lg:p-8 space-y-8">

          {/* ===================== GEOFENCING SECTION ===================== */}
          <section>
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-200">
              <span className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                <HiOutlineGlobeAsiaAustralia className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                  Location & Geofencing
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500">
                  Define office coordinates and allowed punch-in radius.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className={labelBase}>Office Latitude</label>
                <input
                  type="number"
                  step="any"
                  {...register('officeLatitude', { required: true })}
                  className={`${inputBase} font-mono`}
                />
              </div>
              <div>
                <label className={labelBase}>Office Longitude</label>
                <input
                  type="number"
                  step="any"
                  {...register('officeLongitude', { required: true })}
                  className={`${inputBase} font-mono`}
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto text-xs sm:text-sm font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  <HiOutlineMapPin className="w-4 h-4" />
                  <span>Use My Current Location</span>
                </button>
              </div>

              {/* Map + Address */}
              <div className="sm:col-span-2 bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <HiOutlineMapPin className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700">Exact Location View</span>
                </div>

                {lat && lng ? (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="w-full h-56 sm:h-64 rounded-lg overflow-hidden border border-slate-200 bg-white">
                      <iframe
                        title="Map View"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        src={`https://maps.google.com/maps?q=${lat},${lng}&t=&z=17&ie=UTF8&iwloc=&output=embed`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                        Editable Address Label
                      </label>
                      <div className="relative">
                        <textarea
                          {...register('officeAddress')}
                          rows={2}
                          className={`${inputBase} resize-none pr-10`}
                          placeholder="Address will auto-fetch or you can enter manually..."
                        />
                        {isFetchingAddress && (
                          <span className="absolute right-3 top-3 w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin block" />
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs italic py-6 text-center bg-white rounded-lg border border-dashed border-slate-300">
                    Enter latitude and longitude to see the exact map location
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className={labelBase}>Allowed Radius (Meters)</label>
                <input
                  type="number"
                  {...register('allowedRadiusMeters', { required: true, min: 10 })}
                  className={`${inputBase} max-w-full sm:max-w-md`}
                />
                <p className={hintBase}>
                  Maximum distance an employee can be from the office to punch in.
                </p>
              </div>
            </div>
          </section>

          {/* ===================== TIMINGS SECTION ===================== */}
          <section>
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-200">
              <span className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                <HiOutlineClock className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-semibold text-slate-900">Office Timings</h2>
                <p className="text-[11px] sm:text-xs text-slate-500">
                  Set standard work hours, buffer, and late mark thresholds.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className={labelBase}>Punch In Time</label>
                <input
                  type="time"
                  {...register('inTime', { required: true })}
                  className={inputBase}
                />
              </div>
              <div>
                <label className={labelBase}>Punch Out Time</label>
                <input
                  type="time"
                  {...register('outTime', { required: true })}
                  className={inputBase}
                />
              </div>
              <div>
                <label className={labelBase}>Buffer Time (Minutes)</label>
                <input
                  type="number"
                  {...register('bufferMinutes', { required: true, min: 0 })}
                  className={inputBase}
                />
                <p className={hintBase}>Grace period before marking as late (e.g., 15 mins).</p>
              </div>
              <div>
                <label className={labelBase}>Allowed Late Marks</label>
                <input
                  type="number"
                  {...register('allowedLateMarks', { required: true, min: 0 })}
                  className={inputBase}
                />
                <p className={hintBase}>Number of late arrivals allowed before salary deduction.</p>
              </div>
            </div>
          </section>

          {/* Submit */}
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
            >
              {updateMutation.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Settings</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AttendanceSettings;