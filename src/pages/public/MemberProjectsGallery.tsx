import { useState, useEffect } from 'react';
import { Loader2, ExternalLink, Camera, Search } from 'lucide-react';
import { projectService } from '../../services/projectService';
import type { MemberProject } from '../../services/projectService';
import { getFileUrl } from '../../lib/api';
import { toast } from 'react-hot-toast';

export function MemberProjectsGallery() {
    const [projects, setProjects] = useState<MemberProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const data = await projectService.getPublic();
            setProjects(data);
        } catch (error) {
            toast.error('Gagal mengambil data karya member');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                        Galeri <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Karya Anggota</span>
                    </h1>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        Kumpulan karya inovatif dan kreatif yang telah dibuat oleh para anggota MGMP Informatika. 
                        Temukan berbagai inspirasi untuk pembelajaran.
                    </p>
                </div>

                <div className="max-w-2xl mx-auto mb-12">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input 
                            type="text" 
                            placeholder="Cari karya atau nama pembuat..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 bg-white shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-gray-700 font-medium"
                        />
                    </div>
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {projects
                        .filter(p => 
                            (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (p.user_name || '').toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((project) => (
                        <div key={project.id} className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300 overflow-hidden flex flex-col">
                            <a href={project.link_url} target="_blank" rel="noopener noreferrer" className="block relative aspect-video overflow-hidden bg-gray-100">
                                {project.image_url ? (
                                    <>
                                        <img 
                                            src={getFileUrl(project.image_url)} 
                                            alt={project.title} 
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </>
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                                        <Camera className="w-12 h-12 text-blue-200" />
                                    </div>
                                )}
                            </a>
                            
                            <div className="p-6 flex flex-col flex-1">
                                <a href={project.link_url} target="_blank" rel="noopener noreferrer" className="block mb-2">
                                    <h3 className="font-bold text-xl text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                        {project.title}
                                    </h3>
                                </a>
                                
                                <p className="text-gray-500 text-sm line-clamp-3 mb-6 flex-1">
                                    {project.description || 'Tidak ada deskripsi.'}
                                </p>
                                
                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                                            {project.user_name?.[0]?.toUpperCase() || 'M'}
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 line-clamp-1">
                                            {project.user_name || 'Member'}
                                        </span>
                                    </div>
                                    <a 
                                        href={project.link_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="w-10 h-10 rounded-full bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 flex items-center justify-center transition-colors"
                                    >
                                        <ExternalLink className="w-5 h-5" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {projects.length > 0 && projects.filter(p => 
                            (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (p.user_name || '').toLowerCase().includes(searchQuery.toLowerCase())
                        ).length === 0 && (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Tidak Ditemukan</h3>
                        <p className="text-gray-500">Karya yang Anda cari tidak tersedia.</p>
                    </div>
                )}

                {projects.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Belum ada karya</h3>
                        <p className="text-gray-500">Karya dari anggota akan ditampilkan di sini.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
