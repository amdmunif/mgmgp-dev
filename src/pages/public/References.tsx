import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Book, Globe, Gamepad2, ExternalLink, Video, File } from 'lucide-react';
import { referenceService } from '../../services/resourcesService';
import { getFileUrl } from '../../lib/api';
import type { Reference } from '../../types';
import { DataTable } from '../../components/ui/DataTable';

export function References() {
    const { setPageHeader } = useOutletContext<any>() || {};
    const [refs, setRefs] = useState<Reference[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Referensi Belajar',
                description: 'Buku digital, simulator interaktif, dan game edukasi terkurasi.',
                icon: <Book className="w-6 h-6 text-blue-600" />
            });
        }
    }, [setPageHeader]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await referenceService.getAll();
            setRefs(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'Buku': return <Book className="w-5 h-5 text-blue-500" />;
            case 'Simulator': return <Globe className="w-5 h-5 text-green-500" />;
            case 'Game': return <Gamepad2 className="w-5 h-5 text-purple-500" />;
            case 'Video': return <Video className="w-5 h-5 text-red-500" />;
            case 'Lainnya': return <File className="w-5 h-5 text-gray-500" />;
            default: return <Book className="w-5 h-5" />;
        }
    };

    const columns = useMemo(() => [
        {
            header: "Referensi",
            accessorKey: "title" as keyof Reference,
            cell: (item: Reference) => (
                <div className="flex items-start gap-3 py-1">
                    <div className="flex-shrink-0 w-12 h-12 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden">
                        {item.cover_image ? (
                            <img src={getFileUrl(item.cover_image)} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                            getIcon(item.type)
                        )}
                    </div>
                    <div>
                        <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{item.title}</div>
                        {item.description && <div className="text-sm text-gray-500 line-clamp-2 mt-0.5">{item.description}</div>}
                    </div>
                </div>
            )
        },
        {
            header: "Tipe",
            accessorKey: "type" as keyof Reference,
            cell: (item: Reference) => (
                <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-gray-200">
                    {item.type}
                </span>
            ),
            className: "w-32"
        },
        {
            header: "Aksi",
            cell: (item: Reference) => (
                <div className="flex justify-end pr-2">
                    <a
                        href={item.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
                    >
                        <ExternalLink className="w-4 h-4" /> Buka
                    </a>
                </div>
            ),
            className: "w-32 text-right"
        }
    ], []);

    return (
        <div className="max-w-screen-xl mx-auto px-4 py-8 animate-in fade-in duration-500">
            {!setPageHeader && (
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Bank Referensi</h1>
                    <p className="text-gray-500 mt-2">Buku digital, simulator interaktif, dan game edukasi terkurasi.</p>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Memuat data referensi...</div>
                ) : (
                    <DataTable
                        data={refs}
                        columns={columns}
                        searchKeys={['title', 'type', 'description']}
                        pageSize={15}
                    />
                )}
            </div>
        </div>
    );
}
