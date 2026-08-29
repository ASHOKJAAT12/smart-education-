import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus, Trash2, Edit2, Eye, EyeOff, FileText,
    Video, Image as ImageIcon, Link as LinkIcon, FileCheck
} from 'lucide-react';
import { teacherService } from '../../../services/teacherService';
import Spinner from '../../../components/ui/Spinner';
import Badge from '../../../components/ui/Badge';
import EmptyState from '../../../components/ui/EmptyState';
import MaterialFormModal from './MaterialFormModal';

const TYPE_ICONS = {
    pdf: FileText,
    video: Video,
    image: ImageIcon,
    link: LinkIcon,
    document: FileCheck
};

const StudyMaterialsTab = ({ courseId }) => {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState(null);

    const { data: materials, isLoading } = useQuery({
        queryKey: ['course-materials', courseId],
        queryFn: () => teacherService.getCourseMaterials(courseId).then(r => r.data.data),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => teacherService.deleteMaterial(id),
        onSuccess: () => queryClient.invalidateQueries(['course-materials', courseId]),
    });

    const togglePublishMutation = useMutation({
        mutationFn: ({ id, isPublished }) =>
            isPublished ? teacherService.unpublishMaterial(id) : teacherService.publishMaterial(id),
        onMutate: async ({ id, isPublished }) => {
            // Optimistic UI update: instantly snap the toggle before the server responds
            await queryClient.cancelQueries(['course-materials', courseId]);
            const previousMaterials = queryClient.getQueryData(['course-materials', courseId]);

            if (previousMaterials) {
                queryClient.setQueryData(['course-materials', courseId], previousMaterials.map(mat =>
                    mat._id === id ? { ...mat, isPublished: !isPublished } : mat
                ));
            }
            return { previousMaterials };
        },
        onError: (err, variables, context) => {
            // Rollback if there's an error
            if (context?.previousMaterials) {
                queryClient.setQueryData(['course-materials', courseId], context.previousMaterials);
            }
        },
        onSettled: () => {
            // Always sync with the server eventually
            queryClient.invalidateQueries(['course-materials', courseId]);
        },
    });

    const handleDelete = (material) => {
        if (window.confirm(`Are you sure you want to delete "${material.title}"?`)) {
            deleteMutation.mutate(material._id);
        }
    };

    const handleFormClose = () => {
        setIsFormOpen(false);
        setEditingMaterial(null);
    };

    if (isLoading) return <div className="p-10 flex justify-center"><Spinner size="lg" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Study Materials</h2>
                    <p className="text-sm text-slate-500">Manage documents, PDFs, videos, and links attached to this course.</p>
                </div>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Add Material
                </button>
            </div>

            {materials?.length === 0 ? (
                <EmptyState
                    icon={FileText}
                    title="No materials yet"
                    message="Upload your first study material or link to enhance the course."
                    action={
                        <button onClick={() => setIsFormOpen(true)} className="text-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold px-4 py-2 rounded-xl transition-colors">
                            Add Material
                        </button>
                    }
                />
            ) : (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="p-4 w-12 text-center">Ord</th>
                                <th className="p-4">Resource</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {materials?.map((mat) => {
                                const Icon = TYPE_ICONS[mat.type] || FileText;
                                return (
                                    <tr key={mat._id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="p-4 text-center">
                                            <span className="text-sm font-bold text-slate-400">{mat.order}</span>
                                        </td>
                                        <td className="p-4 min-w-0">
                                            <div className="font-bold text-slate-800 flex items-center gap-2">
                                                <Icon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                                <span className="truncate">{mat.title}</span>
                                            </div>
                                            {mat.description && <p className="text-xs text-slate-500 truncate mt-1 max-w-sm">{mat.description}</p>}
                                        </td>
                                        <td className="p-4">
                                            <Badge variant="primary" className="uppercase text-[10px]">{mat.type}</Badge>
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => togglePublishMutation.mutate({ id: mat._id, isPublished: mat.isPublished })}
                                                disabled={togglePublishMutation.isPending}
                                                className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full transition-colors border ${mat.isPublished
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                                    }`}
                                                title="Toggle Visibility"
                                            >
                                                {mat.isPublished ? (
                                                    <><Eye className="w-3.5 h-3.5" /> Published</>
                                                ) : (
                                                    <><EyeOff className="w-3.5 h-3.5" /> Draft</>
                                                )}
                                            </button>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2 px-2">
                                                {mat.type === 'link' && mat.url && (
                                                    <a href={mat.url} data-noinstant target="_blank" rel="noopener noreferrer" className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                                        <LinkIcon className="w-4 h-4" />
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => { setEditingMaterial(mat); setIsFormOpen(true); }}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(mat)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {isFormOpen && (
                <MaterialFormModal
                    courseId={courseId}
                    material={editingMaterial}
                    onClose={handleFormClose}
                />
            )}
        </div>
    );
};

export default StudyMaterialsTab;
