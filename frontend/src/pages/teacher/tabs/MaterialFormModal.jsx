import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, UploadCloud, Link as LinkIcon, FileCheck } from 'lucide-react';
import { teacherService } from '../../../services/teacherService';
import toast from 'react-hot-toast';

const MaterialFormModal = ({ courseId, material, onClose }) => {
    const queryClient = useQueryClient();
    const isEditing = !!material;

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'pdf',
        url: '',
        order: 0,
        isPublished: false,
    });
    const [file, setFile] = useState(null);

    useEffect(() => {
        if (material) {
            setFormData({
                title: material.title || '',
                description: material.description || '',
                type: material.type || 'pdf',
                url: material.url || '',
                order: material.order || 0,
                isPublished: material.isPublished || false,
            });
        }
    }, [material]);

    const mutation = useMutation({
        mutationFn: (submittingData) => {
            if (isEditing) {
                return teacherService.updateMaterial(material._id, submittingData);
            }
            return teacherService.createMaterial(submittingData);
        },
        onSuccess: () => {
            toast.success(`Material ${isEditing ? 'updated' : 'added'} successfully`);
            queryClient.invalidateQueries(['course-materials', courseId]);
            onClose();
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to save material');
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        const data = new FormData();
        data.append('courseId', courseId);
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('type', formData.type);
        data.append('order', formData.order);

        if (isEditing) {
            data.append('isPublished', formData.isPublished);
        }

        if (formData.type === 'link') {
            data.append('url', formData.url);
        } else {
            if (!isEditing && !file) {
                return toast.error('A file is required for this resource type');
            }
            if (file) {
                data.append('file', file);
            }
        }

        mutation.mutate(data);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <h3 className="text-xl font-bold text-slate-800">
                        {isEditing ? 'Edit Material' : 'Add Study Material'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <form id="material-form" onSubmit={handleSubmit} className="space-y-5">

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Resource Type</label>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                {['pdf', 'document', 'video', 'link'].map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        disabled={isEditing}
                                        onClick={() => setFormData({ ...formData, type, file: null })}
                                        className={`px-3 py-2 text-sm font-bold rounded-xl border transition-colors capitalize text-center ${formData.type === type
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                            } ${isEditing && formData.type !== type ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
                                placeholder="E.g., Introduction to Neural Networks"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Description (Optional)</label>
                            <textarea
                                rows={3}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow resize-none"
                                placeholder="Describe what this material covers..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Order Index</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.order}
                                    onChange={e => setFormData({ ...formData, order: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Lower numbers appear first.</p>
                            </div>
                        </div>

                        {formData.type === 'link' ? (
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">External Link URL</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <LinkIcon className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="url"
                                        required
                                        value={formData.url}
                                        onChange={e => setFormData({ ...formData, url: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">File Upload</label>
                                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-indigo-400 transition-colors bg-slate-50 relative group">
                                    <input
                                        type="file"
                                        required={!isEditing}
                                        onChange={(e) => {
                                            const selectedFile = e.target.files[0];
                                            if (selectedFile) {
                                                // Free tier limits: 100MB video, 10MB images/PDFs
                                                const maxMb = formData.type === 'video' ? 100 : 10;
                                                const MAX_SIZE_BYTES = maxMb * 1024 * 1024;

                                                if (selectedFile.size > MAX_SIZE_BYTES) {
                                                    if (formData.type === 'pdf') {
                                                        toast.error(`The PDF size is too large. Maximum PDF size is ${maxMb}MB`);
                                                    } else {
                                                        toast.error(`File size is too large. Maximum is ${maxMb}MB.`);
                                                    }
                                                    e.target.value = null; // Reset input
                                                    setFile(null);
                                                    return;
                                                }
                                            }
                                            setFile(selectedFile);
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        accept={
                                            formData.type === 'pdf' ? '.pdf' :
                                                formData.type === 'video' ? 'video/mp4,video/webm' :
                                                    formData.type === 'image' ? 'image/*' :
                                                        '.doc,.docx,.ppt,.pptx'
                                        }
                                    />
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-indigo-500 group-hover:scale-110 transition-transform">
                                            {file ? <FileCheck className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
                                        </div>
                                        <p className="font-bold text-slate-700">{file ? file.name : `Click to browse or drag & drop`}</p>
                                        <p className="text-xs text-slate-400">
                                            {formData.type === 'pdf' && 'Upload a valid PDF document'}
                                            {formData.type === 'video' && 'MP4 or WebM up to 100MB'}
                                            {formData.type === 'document' && 'Word or PowerPoint documents'}
                                        </p>
                                        {isEditing && !file && (
                                            <p className="text-xs font-semibold text-emerald-600 mt-2 bg-emerald-50 px-2 py-1 rounded-md">
                                                A file is already uploaded. Select a new file to replace it.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-3xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-200 bg-white rounded-xl border border-slate-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="material-form"
                        disabled={mutation.isPending}
                        className="px-6 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
                    >
                        {mutation.isPending && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        {isEditing ? 'Save Changes' : 'Upload Material'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MaterialFormModal;
