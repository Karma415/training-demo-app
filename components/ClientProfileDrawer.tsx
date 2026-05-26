import React, { useState, useEffect } from 'react';
import { X, User, MapPin, Briefcase, AlertTriangle, Globe, Calendar, Phone, Mail } from 'lucide-react';
import { supabase } from '../services/supabase';

interface ClientProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tenantEmail: string | null;
  tenantName: string;
  tenantUnit: string | null;
}

const ClientProfileDrawer: React.FC<ClientProfileDrawerProps> = ({ isOpen, onClose, tenantEmail, tenantName, tenantUnit }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && (tenantEmail || tenantName || tenantUnit)) {
      fetchIntakeData();
    }
  }, [isOpen, tenantEmail, tenantName, tenantUnit]);

  const fetchIntakeData = async () => {
    setLoading(true);
    setError('');
    setData(null);
    try {
      const { data: responseData, error: funcError } = await supabase.functions.invoke('get-intake-data', {
        body: { 
          email: tenantEmail,
          name: tenantName,
          unit: tenantUnit 
        }
      });
      if (funcError) throw funcError;
      if (responseData?.error) throw new Error(responseData.error);
      if (responseData?.message) {
        setError(responseData.message);
      } else {
        setData(responseData?.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch intake data:", err);
      setError(err.message || 'Failed to load client profile data.');
    } finally {
      setLoading(false);
    }
  };

  const getFieldValue = (keyPrefix: string, exact: boolean = false) => {
    if (!data) return '';
    const key = Object.keys(data).find(k => exact ? k.toLowerCase() === keyPrefix.toLowerCase() : k.toLowerCase().includes(keyPrefix.toLowerCase()));
    return key ? data[key] : '';
  };

  // Helper to split text blocks by lines for display
  const formatTextBlock = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        <br />
      </React.Fragment>
    ));
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      <div className={`fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/80">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <User className="w-6 h-6 text-indigo-600" />
              Tenants Personal Information
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Intake form data for {tenantName}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 bg-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <p className="font-bold">Retrieving secure intake records...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <AlertTriangle className="w-12 h-12 text-amber-400 mb-4" />
              <p className="font-bold text-slate-700">{error}</p>
              <p className="text-sm mt-2 text-center max-w-xs">
                The tenant may not have completed the intake form yet, or the information (Unit, Name, Email) does not match exactly.
              </p>
            </div>
          ) : data ? (
            <div className="space-y-10 text-slate-700">
              
              {/* Personal Information */}
              <section className="space-y-4">
                <div className="flex justify-center mb-6">
                  <h3 className="text-xl font-bold text-center">
                    {getFieldValue('first name')} {getFieldValue('middle')} {getFieldValue('last name')}
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="font-bold">City & State of birth:</span> {getFieldValue('City and state of birth')}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="font-bold">Home Phone:</span> {getFieldValue('Home Phone')}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="font-bold">Cell Phone:</span> {getFieldValue('Cell Phone')}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="font-bold">Email Address:</span> {getFieldValue('Email Address')}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4 text-sm space-y-2">
                  <p>
                    <span className="font-bold">Current Street Address:</span> {getFieldValue('Street Address', true) || getFieldValue('Street Address')}
                    <span className="font-bold ml-4">Unit#:</span> {getFieldValue('Unit', true) || getFieldValue('Unit')}
                    {getFieldValue('Temporary Unit') && (
                      <span className="font-bold ml-4">Temporary Unit #: {getFieldValue('Temporary Unit')}</span>
                    )}
                  </p>
                  <p>
                    <span className="font-bold">Current City:</span> {getFieldValue('City', true) || getFieldValue('City')}
                    <span className="font-bold ml-4">State:</span> {getFieldValue('State', true) || getFieldValue('State')}
                    <span className="font-bold ml-4">Zip Code:</span> {getFieldValue('Zip code', true) || getFieldValue('Zip')}
                  </p>
                  
                  {getFieldValue('Do you still live on the property?')?.toLowerCase() === 'no' && (
                    <p className="mt-4 pt-4 border-t border-slate-200">
                      Moved out of the Pierre Hotel unit # {getFieldValue('Previous Unit Number') || '___'} on {getFieldValue('Move-out Date') || '___'}
                    </p>
                  )}
                </div>
              </section>

              {/* Residential History */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold text-center">Residential History – Last five years</h3>
                <div className="text-sm bg-white border border-slate-200 rounded-xl p-4">
                  {getFieldValue('Residential History') ? (
                    formatTextBlock(getFieldValue('Residential History'))
                  ) : (
                    <p className="text-center italic text-slate-500 py-4">Tenant has no previous addresses available to list for the last five years.</p>
                  )}
                </div>
              </section>

              {/* Employment */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold text-center">Employment – Last five years</h3>
                <div className="text-sm bg-white border border-slate-200 rounded-xl p-4">
                  {getFieldValue('Employment') ? (
                    formatTextBlock(getFieldValue('Employment'))
                  ) : (
                    <p className="text-center italic text-slate-500 py-4">Tenant has not listed any employment history for the last five years.</p>
                  )}
                </div>
              </section>

              {/* Criminal History */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold text-center">Criminal history</h3>
                <div className="text-sm bg-white border border-slate-200 rounded-xl p-4">
                  {getFieldValue('Criminal history') && getFieldValue('Criminal history').toLowerCase() !== 'none' && getFieldValue('Criminal history').toLowerCase() !== 'n/a' ? (
                    formatTextBlock(getFieldValue('Criminal history'))
                  ) : (
                    <p className="text-center italic text-slate-500 py-4">Tenant has no previous felonies available to list</p>
                  )}
                </div>
              </section>

              {/* Preferred Language */}
              <section className="space-y-4 pb-8">
                <h3 className="text-xl font-bold text-center">Tenants Preferred Language</h3>
                <div className="text-sm text-center bg-slate-50 border border-slate-200 rounded-xl p-6">
                  {(getFieldValue('read and write in english')?.toLowerCase()?.includes('yes') || 
                    getFieldValue('read and write in english')?.toLowerCase()?.includes('english') || 
                    getFieldValue('speak english with ease')?.toLowerCase()?.includes('yes') ||
                    getFieldValue('speak english with ease')?.toLowerCase()?.includes('english')) ? (
                    <div>
                      <p>The tenants primary language is English.</p>
                      <p>The tenant is able to read, write, & speak English with ease</p>
                    </div>
                  ) : (
                    <div>
                      <p>Tenant needs all documents provided to them in their preferred language of <span className="font-bold underline">{getFieldValue('read and write in english') || 'their primary language'}</span></p>
                      <p className="mt-2">Tenant does not speak English with ease and needs a <span className="font-bold underline">{getFieldValue('read and write in english') || 'foreign'}</span> speaking translator in order to communicate efficiently.</p>
                    </div>
                  )}
                </div>
              </section>

            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default ClientProfileDrawer;
