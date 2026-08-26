import React, { useState } from 'react';
import { Settings, Sliders, Shield, Key, Save, CheckCircle2 } from 'lucide-react';

const SystemSettings = () => {
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Form state mocking global platform variables
    const [formData, setFormData] = useState({
        platformName: 'SmartLearn AI Platform',
        masteryThreshold: 85,
        maxStudentsPerCourse: 250,
        enableTwoFactor: false,
        aiProvider: 'gemini-3.6-flash',
        aiTemperature: 0.7
    });

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
        setSaved(false);
    };

    const handleSave = () => {
        setIsSaving(true);
        // Simulate API latency saving to MongoDB global_settings collection
        setTimeout(() => {
            setIsSaving(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }, 1200);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center">
                        <Settings className="w-8 h-8 mr-3 text-blue-500" /> Platform Settings
                    </h1>
                    <p className="text-slate-400 font-medium mt-1">Configure global application variables and security protocols.</p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-70"
                >
                    {isSaving ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : saved ? (
                        <><CheckCircle2 className="w-5 h-5 text-emerald-300" /> Saved</>
                    ) : (
                        <><Save className="w-5 h-5" /> Save Configuration</>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* General Preferences */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                    <div className="border-b border-slate-800 bg-slate-950/50 p-5 flex items-center gap-3">
                        <Sliders className="w-5 h-5 text-indigo-400" />
                        <h2 className="text-lg font-bold text-white">General Preferences</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Platform Name</label>
                            <input
                                type="text"
                                name="platformName"
                                value={formData.platformName}
                                onChange={handleChange}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center justify-between">
                                Global Mastery Threshold (%)
                                <span className="text-blue-400">{formData.masteryThreshold}%</span>
                            </label>
                            <input
                                type="range"
                                name="masteryThreshold"
                                min="50" max="100" step="5"
                                value={formData.masteryThreshold}
                                onChange={handleChange}
                                className="w-full accent-blue-500"
                            />
                            <p className="text-xs text-slate-500 mt-2">Determines the algorithmic cutoff point where a student is considered "proficient".</p>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Max Students Per Course</label>
                            <input
                                type="number"
                                name="maxStudentsPerCourse"
                                value={formData.maxStudentsPerCourse}
                                onChange={handleChange}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Security */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                        <div className="border-b border-slate-800 bg-slate-950/50 p-5 flex items-center gap-3">
                            <Shield className="w-5 h-5 text-emerald-400" />
                            <h2 className="text-lg font-bold text-white">Security Protocols</h2>
                        </div>
                        <div className="p-6">
                            <label className="flex items-center cursor-pointer group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        name="enableTwoFactor"
                                        checked={formData.enableTwoFactor}
                                        onChange={handleChange}
                                        className="sr-only"
                                    />
                                    <div className={`block w-14 h-8 rounded-full transition-colors ${formData.enableTwoFactor ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                                    <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${formData.enableTwoFactor ? 'translate-x-6' : ''}`}></div>
                                </div>
                                <div className="ml-4">
                                    <div className="font-semibold text-slate-200">Enforce System-wide 2FA</div>
                                    <div className="text-xs text-slate-500">Require multi-factor authentication for all Admin and Teacher roles.</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* AI Configuration */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                        <div className="border-b border-slate-800 bg-slate-950/50 p-5 flex items-center gap-3">
                            <Key className="w-5 h-5 text-amber-400" />
                            <h2 className="text-lg font-bold text-white">AI Engine Configuration</h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Primary AI Provider</label>
                                <select
                                    name="aiProvider"
                                    value={formData.aiProvider}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                                >
                                    <option value="gemini-3.6-flash">Google Gemini 3.6 Flash</option>
                                    <option value="gemini-1.5-pro">Google Gemini 1.5 Pro</option>
                                    <option value="gpt-4">OpenAI GPT-4.0</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center justify-between">
                                    Inference Temperature
                                    <span className="text-amber-400">{formData.aiTemperature}</span>
                                </label>
                                <input
                                    type="range"
                                    name="aiTemperature"
                                    min="0.1" max="1.0" step="0.1"
                                    value={formData.aiTemperature}
                                    onChange={handleChange}
                                    className="w-full accent-amber-500"
                                />
                                <p className="text-xs text-slate-500 mt-2">Lower equals logical/deterministic. Higher equals creative/varied.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemSettings;
