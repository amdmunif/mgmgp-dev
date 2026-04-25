import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Eye, FileText, Gamepad2, Clock } from 'lucide-react';
import { questionService, type QuestionBank } from '../../services/questionService';
import { DataTable } from '../../components/ui/DataTable';

export function MemberArchive() {
    const { setPageHeader } = useOutletContext<any>() || {};
    const [banks, setBanks] = useState<QuestionBank[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Arsip File & Games',
                description: 'Download file latihan, ujian, TTS, dan Wordsearch.',
                icon: <Clock className="w-6 h-6 text-blue-600" />
            });
        }
        loadData();
    }, [setPageHeader]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await questionService.getBanks();
            setBanks(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { 
            header: 'Judul', 
            accessorKey: 'title' as keyof QuestionBank, 
            className: 'font-bold text-gray-900',
            cell: (item: QuestionBank) => (
                <div className="flex flex-col gap-0.5">
                    <span className="leading-tight">{item.title}</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">{item.mapel}</span>
                </div>
            )
        },
        {
            header: 'Kategori',
            accessorKey: 'category' as keyof QuestionBank,
            cell: (item: QuestionBank) => (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    {item.category === 'TTS' || item.category === 'Wordsearch' ?
                        <Gamepad2 className="w-4 h-4 text-purple-500" /> :
                        <FileText className="w-4 h-4 text-blue-500" />
                    }
                    {item.category}
                </div>
            )
        },
        {
            header: 'Akses',
            accessorKey: 'is_premium' as keyof QuestionBank,
            className: 'w-32',
            cell: (item: QuestionBank) => (
                item.is_premium ?
                    <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">Premium</span> :
                    <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">Free</span>
            )
        },
        {
            header: 'Aksi',
            className: 'text-right w-32',
            cell: (item: QuestionBank) => (
                <div className="flex justify-end">
                    <a 
                        href={item.file_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-all"
                    >
                        <Eye className="w-4 h-4" /> Lihat / Download
                    </a>
                </div>
            )
        }
    ];

    return (
        <div className="animate-in fade-in duration-500">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <p>Memuat arsip file...</p>
                    </div>
                ) : (
                    <DataTable
                        data={banks}
                        columns={columns}
                        searchKeys={['title', 'mapel', 'category']}
                        pageSize={12}
                    />
                )}
            </div>
        </div>
    );
}
