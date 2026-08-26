import React from 'react';
import { Settings, Sliders, Shield, Bell, Key, Database } from 'lucide-react';

const SystemSettings = () => {
    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-white flex items-center">
                    <Settings className="w-8 h-8 mr-3 text-blue-500" /> Platform Settings
                </h1>
                <p className="text-slate-400 font-medium mt-1">Configure global application variables and security protocols.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { title: "General Preferences", icon: Sliders, desc: "Manage application name, global theme, and default user settings." },
                    { title: "Security Protocols", icon: Shield, desc: "Adjust password requirements, Two-Factor Auth, and Session TTL." },
                    { title: "API Integrations", icon: Key, desc: "Manage third-party API keys (Cloudinary, Gemini AI, Brevo SMTP)." },
                    { title: "Notification Policies", icon: Bell, desc: "Configure global system alerts and automated marketing triggers." },
                    { title: "Data Management", icon: Database, desc: "Trigger backups, purge generic logs, and monitor storage pools." }
                ].map((item, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 hover:bg-slate-800/50 transition-colors cursor-pointer group">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                            <item.icon className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                        <p className="text-sm text-slate-400">{item.desc}</p>

                        <div className="mt-4 flex items-center text-xs font-bold text-blue-500">
                            Configure <span className="ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">-&gt;</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6 flex items-start gap-4 mt-8">
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-yellow-500">Module Pending Full Implementation</h3>
                    <p className="text-sm text-yellow-400/80 mt-1">
                        The settings configuration module acts as a structural shell for Phase 10. Database injection capabilities for live variables will unlock in future maintenance passes.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SystemSettings;
