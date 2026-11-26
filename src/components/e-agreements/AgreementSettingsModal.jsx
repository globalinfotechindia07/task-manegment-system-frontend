import { useState, useEffect } from 'react';
import {
  HiOutlineXMark,
  HiOutlineKey,
  HiOutlineGlobeAlt,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineArrowPath,
  HiOutlineCommandLine,
  HiOutlineShieldCheck,
  HiOutlineCube,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE'];

const AgreementSettingsModal = ({ isOpen, onClose, onSaved }) => {
  const [activeTab, setActiveTab] = useState('sandbox'); // 'sandbox' or 'production'
  const [activeEnvironment, setActiveEnvironment] = useState('sandbox'); // which env is active for execution
  const [isEnabled, setIsEnabled] = useState(true);
  const [autoSyncTemplates, setAutoSyncTemplates] = useState(true);

  // Sandbox settings state
  const [sandboxApiKey, setSandboxApiKey] = useState('');
  const [sandboxBaseUrl, setSandboxBaseUrl] = useState('https://backend.chitraguptccrms.com/api/v1');
  const [sandboxEndpoints, setSandboxEndpoints] = useState({
    fetchTemplates: {
      name: 'Fetch Templates API',
      method: 'GET',
      url: 'https://backend.chitraguptccrms.com/api/v1/sandbox/agreements/templates',
      description: 'Fetches active agreement templates and document requirements',
    },
    createTemplate: {
      name: 'Create Template API',
      method: 'POST',
      url: 'https://backend.chitraguptccrms.com/api/v1/sandbox/agreements/templates',
      description: 'Creates or updates agreement templates on gateway',
    },
    initiateAgreement: {
      name: 'Initiate Agreement API',
      method: 'POST',
      url: 'https://backend.chitraguptccrms.com/api/v1/sandbox/agreements/initiate',
      description: 'Generates sandbox simulated agreement with Aadhaar eSign',
    },
    checkStatus: {
      name: 'Agreement Status API',
      method: 'GET',
      url: 'https://backend.chitraguptccrms.com/api/v1/sandbox/agreements/:agreement_id/status',
      description: 'Checks digital signature details, eSign audit trail and signed PDF URL',
    },
  });

  // Production settings state
  const [productionApiKey, setProductionApiKey] = useState('');
  const [productionBaseUrl, setProductionBaseUrl] = useState('https://backend.chitraguptccrms.com/api/v1');
  const [productionEndpoints, setProductionEndpoints] = useState({
    fetchTemplates: {
      name: 'Fetch Templates API',
      method: 'GET',
      url: 'https://backend.chitraguptccrms.com/api/v1/production/agreements/templates',
      description: 'Fetches legally binding production templates',
    },
    createTemplate: {
      name: 'Create Template API',
      method: 'POST',
      url: 'https://backend.chitraguptccrms.com/api/v1/production/agreements/templates',
      description: 'Publishes production agreement templates to gateway',
    },
    initiateAgreement: {
      name: 'Initiate Agreement API',
      method: 'POST',
      url: 'https://backend.chitraguptccrms.com/api/v1/production/agreements/initiate',
      description: 'Initiates legally binding Aadhaar eSign agreement for client',
    },
    checkStatus: {
      name: 'Agreement Status API',
      method: 'GET',
      url: 'https://backend.chitraguptccrms.com/api/v1/production/agreements/:agreement_id/status',
      description: 'Retrieves legal audit certificate and signed PDF document',
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [testingKey, setTestingKey] = useState(null); // 'fetchTemplates', 'createTemplate', etc.
  const [configData, setConfigData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/agreements/config');
      if (res.data?.data) {
        const d = res.data.data;
        setConfigData(d);
        setActiveEnvironment(d.environment || 'sandbox');
        setIsEnabled(Boolean(d.isEnabled));
        setAutoSyncTemplates(Boolean(d.autoSyncTemplates));

        // Sandbox data
        if (d.sandbox) {
          setSandboxBaseUrl(d.sandbox.baseUrl || 'https://backend.chitraguptccrms.com/api/v1');
          if (d.sandbox.endpoints) {
            setSandboxEndpoints((prev) => ({
              ...prev,
              ...d.sandbox.endpoints,
            }));
          }
        }

        // Production data
        if (d.production) {
          setProductionBaseUrl(d.production.baseUrl || 'https://backend.chitraguptccrms.com/api/v1');
          if (d.production.endpoints) {
            setProductionEndpoints((prev) => ({
              ...prev,
              ...d.production.endpoints,
            }));
          }
        }
      }
    } catch (err) {
      toast.error('Failed to load agreement API settings');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleEndpointChange = (env, endpointKey, field, value) => {
    if (env === 'sandbox') {
      setSandboxEndpoints((prev) => ({
        ...prev,
        [endpointKey]: {
          ...prev[endpointKey],
          [field]: value,
        },
      }));
    } else {
      setProductionEndpoints((prev) => ({
        ...prev,
        [endpointKey]: {
          ...prev[endpointKey],
          [field]: value,
        },
      }));
    }
  };

  const handleTestEndpoint = async (env, endpointKey) => {
    const isSandbox = env === 'sandbox';
    const apiKey = isSandbox ? sandboxApiKey : productionApiKey;
    const endpoints = isSandbox ? sandboxEndpoints : productionEndpoints;
    const baseUrl = isSandbox ? sandboxBaseUrl : productionBaseUrl;
    const targetEndpoint = endpoints[endpointKey];

    setTestingKey(`${env}_${endpointKey}`);
    try {
      const res = await api.post('/agreements/config/test', {
        apiKey,
        environment: env,
        baseUrl,
        endpointKey,
        method: targetEndpoint?.method || 'GET',
        url: targetEndpoint?.url,
      });

      if (res.data?.success) {
        toast.success(
          `${targetEndpoint?.name} [${targetEndpoint?.method}]: HTTP ${res.data.httpStatus || 200} Connected successfully!`
        );
        loadConfig();
      } else {
        toast.error(res.data?.message || 'Endpoint test failed');
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || `Failed to connect to ${targetEndpoint?.name} (${env})`
      );
    } finally {
      setTestingKey(null);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        environment: activeEnvironment,
        isEnabled,
        autoSyncTemplates,
        sandbox: {
          apiKey: sandboxApiKey,
          baseUrl: sandboxBaseUrl,
          isEnabled: true,
          endpoints: sandboxEndpoints,
        },
        production: {
          apiKey: productionApiKey,
          baseUrl: productionBaseUrl,
          isEnabled: true,
          endpoints: productionEndpoints,
        },
      };

      const res = await api.put('/agreements/config', payload);

      toast.success(res.data?.message || 'E-Agreement API configuration saved!');
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const currentEndpoints = activeTab === 'sandbox' ? sandboxEndpoints : productionEndpoints;
  const currentApiKey = activeTab === 'sandbox' ? sandboxApiKey : productionApiKey;
  const setCurrentApiKey = activeTab === 'sandbox' ? setSandboxApiKey : setProductionApiKey;
  const currentBaseUrl = activeTab === 'sandbox' ? sandboxBaseUrl : productionBaseUrl;
  const setCurrentBaseUrl = activeTab === 'sandbox' ? setSandboxBaseUrl : setProductionBaseUrl;
  const currentEnvData = activeTab === 'sandbox' ? configData?.sandbox : configData?.production;

  const endpointList = [
    {
      key: 'fetchTemplates',
      label: '1. Fetch Agreement Templates API',
      hint: 'Fetches template list and document requirements',
      defaultMethod: 'GET',
    },
    {
      key: 'createTemplate',
      label: '2. Create / Design Template API',
      hint: 'Publishes template design with dynamic parameters {{variables}}',
      defaultMethod: 'POST',
    },
    {
      key: 'initiateAgreement',
      label: '3. Initiate / Generate Agreement API',
      hint: 'Generates agreement document with signer data and Aadhaar eSign',
      defaultMethod: 'POST',
    },
    {
      key: 'checkStatus',
      label: '4. Agreement Status & Verification API',
      hint: 'Syncs live signing status, certificate validity and PDF link',
      defaultMethod: 'GET',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <HiOutlineCommandLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-heading font-extrabold text-slate-900">
                E-Agreement Gateway API Settings
              </h3>
              <p className="text-xs text-slate-500 font-sans-modern">
                Configure 4 connected APIs for Sandbox and Production with custom HTTP methods
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Active Environment & Global Switch Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div>
              <span className="text-[10px] uppercase font-mono-tech font-bold text-indigo-300 tracking-wider block">
                Active System Environment
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-heading font-bold text-white">
                  Currently Executing in:
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-heading font-extrabold ${
                    activeEnvironment === 'production'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {activeEnvironment === 'production' ? 'Production Mode' : 'Sandbox Testing Mode'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setActiveEnvironment('sandbox')}
                className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-all cursor-pointer ${
                  activeEnvironment === 'sandbox'
                    ? 'bg-amber-400 text-slate-900 shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Sandbox
              </button>
              <button
                type="button"
                onClick={() => setActiveEnvironment('production')}
                className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-all cursor-pointer ${
                  activeEnvironment === 'production'
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Production
              </button>
            </div>
          </div>

          {/* Active Live Gateway Status Banner */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse shrink-0 ring-4 ring-emerald-200" />
              <div>
                <span className="text-xs font-heading font-extrabold text-emerald-950 block">
                  Connected Gateway Dispatch Active
                </span>
                <span className="text-[11px] text-emerald-800 font-sans-modern">
                  All 4 E-Agreement requests (Fetch, Create, Initiate, Status) dispatch directly to the APIs configured below.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-mono-tech text-[10px] font-bold uppercase tracking-wider shadow-xs">
                ● Live Dispatch
              </span>
            </div>
          </div>

          {/* Configuration Tabs: Sandbox vs Production */}
          <div>
            <div className="flex border-b border-slate-200 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab('sandbox')}
                className={`flex items-center gap-2 py-2.5 px-5 font-heading font-bold text-xs border-b-2 transition-all cursor-pointer ${
                  activeTab === 'sandbox'
                    ? 'border-amber-500 text-amber-700 bg-amber-50/50 rounded-t-xl'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Sandbox Environment (4 APIs)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('production')}
                className={`flex items-center gap-2 py-2.5 px-5 font-heading font-bold text-xs border-b-2 transition-all cursor-pointer ${
                  activeTab === 'production'
                    ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-xl'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                Production Environment (4 APIs)
              </button>
            </div>

            {/* Current Environment Details Card */}
            <div className="space-y-4">
              {/* Status Header */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/80">
                <div>
                  <span className="text-xs font-heading font-bold text-slate-800 block">
                    {activeTab === 'sandbox' ? 'Sandbox API Key & Endpoints' : 'Production Live API Key & Endpoints'}
                  </span>
                  <p className="text-[11px] text-slate-500 font-sans-modern">
                    Status:{' '}
                    {currentEnvData?.hasApiKey
                      ? `Active Key Configured (${currentEnvData.apiKeyMasked})`
                      : 'No Key Saved (Simulation Active)'}
                    {currentEnvData?.lastTestedAt && (
                      <span className="ml-2">
                        • Last Test:{' '}
                        <strong
                          className={
                            currentEnvData.lastTestStatus === 'SUCCESS' ? 'text-emerald-600' : 'text-rose-600'
                          }
                        >
                          {currentEnvData.lastTestStatus}
                        </strong>
                      </span>
                    )}
                  </p>
                </div>
                <span
                  className={`w-3 h-3 rounded-full ${
                    currentEnvData?.hasApiKey ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                  }`}
                />
              </div>

              {/* API Key Input */}
              <div className="space-y-1">
                <label className="block text-xs font-heading font-bold text-slate-800">
                  {activeTab === 'sandbox' ? 'Sandbox' : 'Production'} API Key (
                  <code className="font-mono-tech text-indigo-600">x-api-key</code>)
                </label>
                <input
                  type="text"
                  value={currentApiKey}
                  onChange={(e) => setCurrentApiKey(e.target.value)}
                  placeholder={
                    currentEnvData?.apiKeyMasked
                      ? `Current: ${currentEnvData.apiKeyMasked} (Enter to update)`
                      : activeTab === 'sandbox'
                      ? 'ak_test_eagreement_38cf5de743c4b8dc379a257e9b9d'
                      : 'ak_live_eagreement_...'
                  }
                  className="w-full px-3.5 py-2 text-xs font-mono-tech rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              {/* Base URL Input */}
              <div className="space-y-1">
                <label className="block text-xs font-heading font-bold text-slate-800">
                  Gateway Base URL
                </label>
                <input
                  type="text"
                  value={currentBaseUrl}
                  onChange={(e) => setCurrentBaseUrl(e.target.value)}
                  placeholder="https://backend.chitraguptccrms.com/api/v1"
                  className="w-full px-3.5 py-2 text-xs font-mono-tech rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              {/* 4 Connected APIs Box */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono-tech font-bold uppercase tracking-wider text-slate-600 block">
                    4 CONNECTED API ENDPOINTS ({activeTab.toUpperCase()})
                  </span>
                  <span className="text-[11px] text-slate-500 font-sans-modern">
                    Configure custom URL &amp; Method for each
                  </span>
                </div>

                <div className="space-y-3">
                  {endpointList.map((ep) => {
                    const currentEp = currentEndpoints[ep.key] || {};
                    const isTestingThis = testingKey === `${activeTab}_${ep.key}`;

                    return (
                      <div
                        key={ep.key}
                        className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-heading font-bold text-slate-900 block">
                              {ep.label}
                            </span>
                            <span className="text-[11px] text-slate-500 font-sans-modern">
                              {ep.hint}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleTestEndpoint(activeTab, ep.key)}
                            disabled={isTestingThis}
                            className="px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-heading font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                          >
                            {isTestingThis ? (
                              <>
                                <HiOutlineArrowPath className="w-3.5 h-3.5 animate-spin" />
                                <span>Testing...</span>
                              </>
                            ) : (
                              <>
                                <HiOutlineGlobeAlt className="w-3.5 h-3.5" />
                                <span>Test API</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Method & URL Row */}
                        <div className="flex items-center gap-2">
                          {/* Method Selector */}
                          <div className="w-24 shrink-0">
                            <select
                              value={currentEp.method || ep.defaultMethod}
                              onChange={(e) =>
                                handleEndpointChange(activeTab, ep.key, 'method', e.target.value)
                              }
                              className="w-full px-2.5 py-2 text-xs font-mono-tech font-bold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                            >
                              {HTTP_METHODS.map((m) => (
                                <option key={m} value={m}>
                                  {m}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* URL Input */}
                          <div className="flex-1">
                            <input
                              type="text"
                              value={currentEp.url || ''}
                              onChange={(e) =>
                                handleEndpointChange(activeTab, ep.key, 'url', e.target.value)
                              }
                              placeholder={`https://backend.chitraguptccrms.com/api/v1/${activeTab}/...`}
                              className="w-full px-3 py-2 text-xs font-mono-tech rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-heading font-bold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-heading font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Saving Changes...' : 'Save 4 APIs Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgreementSettingsModal;
