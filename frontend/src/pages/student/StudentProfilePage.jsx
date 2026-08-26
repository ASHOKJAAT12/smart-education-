import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { User2, Mail, BookOpen, Clock, Target, Camera, Save, X, AlertCircle, Settings } from 'lucide-react';
import { getMe, updateMe, uploadAvatar } from '../../services/authService';

const goalLabel = {
    exam_prep: 'Exam Preparation',
    deepen_knowledge: 'Deepen Knowledge',
    career: 'Career Growth',
    revision: 'Revision',
};

const ProfileField = ({ label, value, icon: Icon }) => (
    <div className="flex items-start gap-3 py-3 border-b border-slate-800 last:border-0">
        <Icon className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
            <p className="text-xs text-slate-500 mb-0.5">{label}</p>
            <p className="text-sm text-slate-200 font-medium">{value || <span className="text-slate-600 italic">Not set</span>}</p>
        </div>
    </div>
);

const StudentProfilePage = () => {
    const qc = useQueryClient();
    const fileInputRef = useRef(null);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({});
    const [avatarError, setAvatarError] = useState('');
    const [saveError, setSaveError] = useState('');

    const { data, isLoading, isError } = useQuery({
        queryKey: ['profile'],
        queryFn: getMe,
        select: (r) => r.data,
        onSuccess: (d) => { if (!editing) setForm({ name: d.name, semester: d.semester || '', learningGoal: d.learningGoal || '', dailyStudyTime: d.dailyStudyTime || '' }); },
    });

    const updateMutation = useMutation({
        mutationFn: updateMe,
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['profile'] }); setEditing(false); setSaveError(''); },
        onError: (err) => setSaveError(err?.response?.data?.error || 'Failed to save. Please try again.'),
    });

    const avatarMutation = useMutation({
        mutationFn: uploadAvatar,
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['profile'] }); setAvatarError(''); },
        onError: (err) => setAvatarError(err?.response?.data?.error || 'Upload failed. Max 50MB, images only.'),
    });

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('avatar', file);
        avatarMutation.mutate(fd);
    };

    const handleSave = () => {
        const updates = {};
        if (form.name) updates.name = form.name;
        if (form.semester !== undefined) updates.semester = form.semester || null;
        if (form.learningGoal !== undefined) updates.learningGoal = form.learningGoal || null;
        if (form.dailyStudyTime !== undefined) updates.dailyStudyTime = form.dailyStudyTime ? Number(form.dailyStudyTime) : null;
        updateMutation.mutate(updates);
    };

    if (isLoading) return (
        <div className="max-w-2xl mx-auto p-6 space-y-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-slate-800 rounded-2xl animate-pulse" />)}
        </div>
    );

    if (isError) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-6">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-slate-300">Failed to load profile</p>
        </div>
    );

    const user = data;

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-white">My Profile</h1>
                {!editing ? (
                    <button
                        onClick={() => { setEditing(true); setForm({ name: user.name, semester: user.semester || '', learningGoal: user.learningGoal || '', dailyStudyTime: user.dailyStudyTime || '' }); }}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                    >
                        <Settings className="w-4 h-4" /> Edit
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button onClick={() => { setEditing(false); setSaveError(''); }} className="flex items-center gap-1 text-sm text-slate-400 px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors">
                            <X className="w-4 h-4" /> Cancel
                        </button>
                        <button onClick={handleSave} disabled={updateMutation.isPending} className="flex items-center gap-1 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                            <Save className="w-4 h-4" /> {updateMutation.isPending ? 'Saving…' : 'Save'}
                        </button>
                    </div>
                )}
            </div>

            {saveError && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">{saveError}</div>}

            {/* Avatar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-5">
                <div className="relative">
                    {user.profilePicture ? (
                        <img src={user.profilePicture} alt="" className="w-20 h-20 rounded-full object-cover" />
                    ) : (
                        <div className="w-20 h-20 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                            <span className="text-violet-300 text-2xl font-bold">{user.name?.[0]?.toUpperCase()}</span>
                        </div>
                    )}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={avatarMutation.isPending}
                        className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-violet-600 border-2 border-slate-900 flex items-center justify-center hover:bg-violet-700 transition-colors"
                    >
                        <Camera className="w-3 h-3 text-white" />
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>
                <div>
                    <p className="font-bold text-white text-lg">{user.name}</p>
                    <p className="text-slate-400 text-sm">{user.email}</p>
                    <span className="inline-block mt-1 text-xs bg-violet-600/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full capitalize">{user.role}</span>
                    {avatarError && <p className="text-red-400 text-xs mt-1">{avatarError}</p>}
                    {avatarMutation.isPending && <p className="text-slate-400 text-xs mt-1">Uploading…</p>}
                </div>
            </div>

            {/* Info — edit mode */}
            {editing ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Edit Details</h2>
                    {[
                        { key: 'name', label: 'Full Name', type: 'text' },
                        { key: 'semester', label: 'Semester', type: 'text' },
                    ].map(({ key, label, type }) => (
                        <div key={key}>
                            <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
                            <input
                                type={type}
                                value={form[key] || ''}
                                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-violet-500 transition-colors"
                            />
                        </div>
                    ))}
                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5">Learning Goal</label>
                        <select
                            value={form.learningGoal || ''}
                            onChange={(e) => setForm((f) => ({ ...f, learningGoal: e.target.value }))}
                            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-violet-500 transition-colors"
                        >
                            <option value="">— Select —</option>
                            {Object.entries(goalLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5">Daily Study Target (minutes)</label>
                        <input
                            type="number" min="15" max="480"
                            value={form.dailyStudyTime || ''}
                            onChange={(e) => setForm((f) => ({ ...f, dailyStudyTime: e.target.value }))}
                            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-violet-500 transition-colors"
                        />
                    </div>
                </div>
            ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-2">Profile Details</h2>
                    <ProfileField label="Email" value={user.email} icon={Mail} />
                    <ProfileField label="Semester" value={user.semester} icon={BookOpen} />
                    <ProfileField label="Learning Goal" value={goalLabel[user.learningGoal]} icon={Target} />
                    <ProfileField label="Daily Study Target" value={user.dailyStudyTime ? `${user.dailyStudyTime} min / day` : null} icon={Clock} />
                </div>
            )}

            {/* Course + Subjects (read-only, edit via onboarding) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Course & Subjects</h2>
                    <Link to="/student/onboarding" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">Update →</Link>
                </div>
                <ProfileField label="Enrolled Course" value={user.course?.title} icon={BookOpen} />
                <div className="pt-3">
                    <p className="text-xs text-slate-500 mb-2">Subjects</p>
                    {user.subjects?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {user.subjects.map((s) => (
                                <span key={s._id || s} className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-lg">{s.name || s}</span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-600 text-sm italic">No subjects selected</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentProfilePage;
