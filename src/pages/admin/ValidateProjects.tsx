import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle, Trash2, ExternalLink } from 'lucide-react';
import { projectService, MemberProject } from '../../services/projectService';
import { toast } from 'react-hot-toast';
import { getFileUrl } from '../../lib/api';
import { Button } from '../../components/ui/button';

export function ValidateProjects() {
    const { setPageHeader } = useOutletContext<any>() || {};
    const [projects, setProjects] = useState<MemberProject[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Validasi Karya',
                description: 'Validasi proyek/karya yang diunggah oleh anggota.',
                icon: <CheckCircle className="w-6 h-6" />
            });
        }
        fetchProjects();
    }, [setPageHeader]);

    const fetchProjects = async () => {
        try {
            const data = await projectService.getAll();
            setProjects(data);
        } catch (error) {
            toast.error('Gagal mengambil data proyek');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
        try {
            await projectService.updateStatus(id, status);
            toast.success(`Karya berhasil di${status === 'approved' ? 'setujui' : 'tolak'}`);
            fetchProjects();
        } catch (error) {
            toast.error('Gagal mengupdate status');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus karya ini secara permanen?')) return;
        try {
            await projectService.delete(id);
            toast.success('Karya berhasil dihapus');
            fetchProjects();
        } catch (error) {
            toast.error('Gagal menghapus karya');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                    <div key={project.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                        {project.image_url && (
                            <img 
                                src={getFileUrl(project.image_url)} 
                                alt={project.title} 
                                className="w-full h-48 object-cover bg-gray-50"
                            />
                        )}
                        <div className="p-5 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-gray-900 line-clamp-1">{project.title}</h3>
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                    project.status === 'approved' ? 'bg-green-100 text-green-700' :
                                    project.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                                }`}>
                                    {project.status === 'approved' ? 'Disetujui' : project.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-1">{project.description}</p>
                            
                            <div className="text-xs text-gray-400 mb-4 flex justify-between items-center">
                                <span>Oleh: {project.user_name || 'Member'}</span>
                                <a href={project.link_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 flex items-center hover:underline">
                                    Lihat Link <ExternalLink className="w-3 h-3 ml-1" />
                                </a>
                            </div>
                            
                            <div className="flex gap-2 pt-4 border-t border-gray-100">
                                {project.status === 'pending' && (
                                    <>
                                        <Button 
                                            onClick={() => handleUpdateStatus(project.id, 'approved')} 
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white h-9"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-1" /> Setujui
                                        </Button>
                                        <Button 
                                            onClick={() => handleUpdateStatus(project.id, 'rejected')} 
                                            variant="destructive"
                                            className="flex-1 h-9"
                                        >
                                            <XCircle className="w-4 h-4 mr-1" /> Tolak
                                        </Button>
                                    </>
                                )}
                                {(project.status === 'approved' || project.status === 'rejected') && (
                                    <Button 
                                        onClick={() => handleUpdateStatus(project.id, 'pending')} 
                                        variant="outline" 
                                        className="flex-1 h-9 text-gray-600"
                                    >
                                        Batal Validasi
                                    </Button>
                                )}
                                <Button 
                                    onClick={() => handleDelete(project.id)} 
                                    variant="outline"
                                    className="h-9 px-3 text-red-600 hover:bg-red-50 hover:text-red-700"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
                
                {projects.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-100 border-dashed">
                        Belum ada karya yang diunggah.
                    </div>
                )}
            </div>
        </div>
    );
}
