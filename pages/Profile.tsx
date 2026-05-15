import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabase';
import { User, Mail, Phone, Home, Save, CheckCircle2, Loader2, AlertCircle, Camera, Trash2 } from 'lucide-react';

const Profile: React.FC = () => {
    const { user, setUser } = useApp();
    const isAttorney = user.role === 'legal_counsel';
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const toDateInputValue = (value?: string | null) => {
        if (!value) return '';
        return value.includes('T') ? value.split('T')[0] : value;
    };

    const getInitialFormData = () => ({
        firstName: user.firstName || user.name.split(' ')[0] || '',
        lastName: user.lastName || user.name.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        phone: user.phone || '',
        monthlyRent: user.monthlyRent ? user.monthlyRent.toString() : '',
        moveInDate: toDateInputValue(user.moveInDate),
        unit: user.unit || '',
        requestsAttorney: user.requestsAttorney || false,
        temporaryUnit: user.temporaryUnit || '',
        temporaryMoveInDate: user.temporaryMoveInDate || '',
        temporaryMoveOutDate: user.temporaryMoveOutDate || ''
    });

    const [formData, setFormData] = useState(getInitialFormData);

    useEffect(() => {
        setFormData(getInitialFormData());
    }, [user.id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setMessage({ type: 'error', text: 'Please select an image file (JPG, PNG, etc.)' });
            setTimeout(() => setMessage(null), 5000);
            return;
        }

        const compressImage = (imageFile: File, maxWidth = 1000, quality = 0.8): Promise<File | Blob> => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.readAsDataURL(imageFile);
                reader.onload = (event) => {
                    const img = new Image();
                    img.src = event.target?.result as string;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;

                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }

                        canvas.width = width;
                        canvas.height = height;

                        const ctx = canvas.getContext('2d');
                        ctx?.drawImage(img, 0, 0, width, height);

                        canvas.toBlob(
                            (blob) => {
                                if (blob) {
                                    resolve(new File([blob], imageFile.name, {
                                        type: 'image/jpeg',
                                        lastModified: Date.now(),
                                    }));
                                } else {
                                    resolve(imageFile);
                                }
                            },
                            'image/jpeg',
                            quality
                        );
                    };
                    img.onerror = () => resolve(imageFile);
                };
                reader.onerror = () => resolve(imageFile);
            });
        };

        try {
            setIsUploadingAvatar(true);
            setMessage(null);
            
            // Compress image for profile (smaller is better)
            const fileToUpload = await compressImage(file);
            const userId = user.supabaseId || user.id;
            const fileExt = file.name.split('.').pop();
            const filePath = `${userId}/avatar.${fileExt}`;

            // Upload to storage (upsert: true to overwrite existing)
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, fileToUpload, { upsert: true });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const publicUrl = urlData.publicUrl + '?t=' + Date.now(); // Cache-bust

            // Update tenant record
            const { error: dbError } = await supabase
                .from('tenants')
                .update({ avatar_url: publicUrl })
                .eq('id', userId);

            if (dbError) throw dbError;

            // Update local state
            setUser({ ...user, avatarUrl: publicUrl });
            setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
        } catch (err: any) {
            console.error('Avatar upload failed:', err);
            setMessage({ type: 'error', text: err.message || 'Failed to upload profile picture.' });
        } finally {
            setIsUploadingAvatar(false);
            setTimeout(() => setMessage(null), 5000);
        }
    };

    const handleRemoveAvatar = async () => {
        if (!confirm('Remove your profile picture?')) return;
        try {
            setIsUploadingAvatar(true);
            const userId = user.supabaseId || user.id;

            // Clear DB reference
            const { error: dbError } = await supabase
                .from('tenants')
                .update({ avatar_url: null })
                .eq('id', userId);

            if (dbError) throw dbError;

            // Try to delete the file from storage (non-critical if it fails)
            try {
                const { data: files } = await supabase.storage.from('avatars').list(userId);
                if (files && files.length > 0) {
                    await supabase.storage.from('avatars').remove(files.map(f => `${userId}/${f.name}`));
                }
            } catch (storageErr) {
                console.warn('Could not delete avatar file from storage:', storageErr);
            }

            setUser({ ...user, avatarUrl: undefined });
            setMessage({ type: 'success', text: 'Profile picture removed.' });
        } catch (err: any) {
            console.error('Remove avatar failed:', err);
            setMessage({ type: 'error', text: err.message || 'Failed to remove profile picture.' });
        } finally {
            setIsUploadingAvatar(false);
            setTimeout(() => setMessage(null), 5000);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        try {
            const monthlyRent = formData.monthlyRent.trim() === '' ? null : Number(formData.monthlyRent);
            if (monthlyRent !== null && Number.isNaN(monthlyRent)) {
                throw new Error('Monthly rent must be a valid number.');
            }

            // Update tenants table
            const { error: dbError } = await supabase
                .from('tenants')
                .update({
                    first_name: formData.firstName.trim(),
                    last_name: formData.lastName.trim(),
                    email: formData.email.trim(),
                    phone: formData.phone.trim(),
                    monthly_rent: monthlyRent,
                    move_in_date: formData.moveInDate || null,
                    unit_number: formData.unit,
                    requests_attorney: formData.requestsAttorney,
                    temporary_unit: formData.temporaryUnit || null,
                    temp_move_in_date: formData.temporaryMoveInDate || null,
                    temp_move_out_date: formData.temporaryMoveOutDate || null
                })
                .eq('id', user.supabaseId || user.id);

            if (dbError) throw dbError;

            // Update local context
            setUser({
                ...user,
                name: `${formData.firstName} ${formData.lastName}`.trim(),
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                monthlyRent: monthlyRent || 0,
                moveInDate: formData.moveInDate,
                unit: formData.unit,
                requestsAttorney: formData.requestsAttorney,
                temporaryUnit: formData.temporaryUnit,
                temporaryMoveInDate: formData.temporaryMoveInDate,
                temporaryMoveOutDate: formData.temporaryMoveOutDate
            });

            setMessage({ type: 'success', text: 'Personal information updated successfully.' });
        } catch (err: any) {
            console.error("Failed to update profile", err);
            setMessage({ type: 'error', text: err.message || 'Failed to update profile. Please try again.' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage(null), 5000);
        }
    };

    const initials = `${formData.firstName.charAt(0)}${formData.lastName.charAt(0)}`;

    return (
        <div className="max-w-3xl animate-in fade-in pb-20">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                    <User className="w-8 h-8 text-[#1e3a8a]" />
                    Account Settings
                </h1>
                <p className="text-slate-500 mt-2 font-medium">Manage your personal information and contact details.</p>
            </div>

            <form onSubmit={handleSave} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
                
                {/* Avatar Section */}
                <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                    <div className="relative group">
                        <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black shadow-lg overflow-hidden bg-[#1e3a8a] text-white ring-4 ring-blue-50">
                            {isUploadingAvatar ? (
                                <Loader2 className="w-8 h-8 animate-spin" />
                            ) : user.avatarUrl ? (
                                <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                initials
                            )}
                        </div>
                        {/* Hover overlay */}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingAvatar}
                            className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
                        >
                            <Camera className="w-6 h-6 text-white" />
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                        />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-slate-800">Profile Picture</h2>
                        <p className="text-sm text-slate-500 font-medium mb-3">Click the photo to upload a new image. Max 2MB.</p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploadingAvatar}
                                className="text-xs bg-[#1e3a8a] text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-800 transition disabled:opacity-50 flex items-center gap-1.5"
                            >
                                <Camera className="w-3.5 h-3.5" /> Upload Photo
                            </button>
                            {user.avatarUrl && (
                                <button
                                    type="button"
                                    onClick={handleRemoveAvatar}
                                    disabled={isUploadingAvatar}
                                    className="text-xs bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg font-bold hover:bg-red-100 transition disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Remove
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Personal Information Header */}
                <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Personal Information</h2>
                        <p className="text-sm text-slate-500 font-medium">Update your profile used across SF Housing Hub.</p>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                        {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {message.text}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">First Name</label>
                        <div className="relative">
                            <User className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input 
                                type="text" name="firstName" value={formData.firstName} onChange={handleChange} required
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] transition-all font-medium text-slate-700" 
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Last Name</label>
                        <div className="relative">
                            <User className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input 
                                type="text" name="lastName" value={formData.lastName} onChange={handleChange} required
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] transition-all font-medium text-slate-700" 
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                        <div className="relative">
                            <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input 
                                type="email" name="email" value={formData.email} onChange={handleChange} required
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] transition-all font-medium text-slate-700" 
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Phone Number</label>
                        <div className="relative">
                            <Phone className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input 
                                type="tel" name="phone" value={formData.phone} onChange={handleChange}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] transition-all font-medium text-slate-700" 
                            />
                        </div>
                    </div>

                    {!isAttorney && (
                        <>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Monthly Rent ($)</label>
                                <div className="relative">
                                    <i className="fa-solid fa-dollar-sign text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 w-5 text-center"></i>
                                    <input 
                                        type="number" name="monthlyRent" value={formData.monthlyRent} onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] transition-all font-medium text-slate-700" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Unit Number</label>
                                <div className="relative">
                                    <Home className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                    <input 
                                        type="text" name="unit" value={formData.unit} onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] transition-all font-medium text-slate-700" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Move-In Date</label>
                                <div className="relative">
                                    <i className="fa-regular fa-calendar text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 w-5 text-center"></i>
                                    <input
                                        type="date" name="moveInDate" value={formData.moveInDate} onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] transition-all font-medium text-slate-700"
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Temporary Relocation Section */}
                {!isAttorney && (
                    <div className="pt-6 border-t border-slate-100">
                    <div className="flex items-center gap-4 pb-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Temporary Relocation (Decant)</h2>
                            <p className="text-sm text-slate-500 font-medium max-w-xl">
                                If you have been temporarily moved to another unit due to repairs or safety issues in your primary unit, enter the details here. This ensures any reported issues accurately track where you are living.
                            </p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Temporary Unit</label>
                            <div className="relative">
                                <Home className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input 
                                    type="text" name="temporaryUnit" value={formData.temporaryUnit} onChange={handleChange}
                                    placeholder="e.g. 405"
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] transition-all font-medium text-slate-700" 
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Move-in Date <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <i className="fa-regular fa-calendar text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 w-5 text-center"></i>
                                <input 
                                    type="date" name="temporaryMoveInDate" value={formData.temporaryMoveInDate} onChange={handleChange}
                                    required={!!formData.temporaryUnit}
                                    className={`w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] transition-all font-medium text-slate-700 ${!formData.temporaryMoveInDate && formData.temporaryUnit ? 'ring-2 ring-red-400 border-red-400' : ''}`} 
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Move-out Date</label>
                            <div className="relative">
                                <i className="fa-solid fa-calendar-check text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 w-5 text-center"></i>
                                <input 
                                    type="date" name="temporaryMoveOutDate" value={formData.temporaryMoveOutDate} onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] transition-all font-medium text-slate-700" 
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium">Leave blank if currently displaced.</p>
                        </div>
                    </div>
                </div>
                )}

                {!isAttorney && (
                <div className="pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm">Request Legal Representation</h3>
                            <p className="text-xs text-slate-500 mt-1 max-w-sm">Share my records and issues securely with assigned legal counsel for review and assistance.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                name="requestsAttorney"
                                checked={formData.requestsAttorney} 
                                onChange={(e) => setFormData({ ...formData, requestsAttorney: e.target.checked })}
                                className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1e3a8a]"></div>
                        </label>
                    </div>
                </div>
                )}

                <div className="pt-6 border-t border-slate-100 flex justify-end">
                    <button 
                        type="submit" 
                        disabled={isSaving}
                        className="flex items-center px-8 py-3 bg-[#1e3a8a] text-white rounded-xl font-bold hover:bg-blue-900 transition-all shadow-md active:scale-95 disabled:opacity-70"
                    >
                        {isSaving ? (
                            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving Changes...</>
                        ) : (
                            <><Save className="w-5 h-5 mr-2" /> Save Settings</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Profile;
