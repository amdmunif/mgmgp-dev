import { useState } from 'react';
import { Loader2, AlertCircle, Download, ExternalLink } from 'lucide-react';
import { Button } from './button';

interface FileViewerProps {
    url: string;
    title?: string;
    type?: string;
    className?: string;
}

export function FileViewer({ url, title, type, className = "" }: FileViewerProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Determine type from extension if not provided
    const getFileType = (url: string) => {
        if (type) return type;
        const ext = url.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image';
        if (ext === 'pdf') return 'pdf';
        if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext || '')) return 'office';
        return 'unknown';
    };

    const fileType = getFileType(url);

    // Google Docs Viewer URL for Office files
    const googleDocsViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;

    const handleLoad = () => setLoading(false);
    const handleError = () => {
        setLoading(false);
        setError(true);
    };

    return (
        <div className={`relative w-full h-full bg-gray-100 rounded-lg overflow-hidden border border-gray-200 ${className}`}>
            {loading && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <span className="ml-2 text-sm text-gray-500">Memuat dokumen...</span>
                </div>
            )}

            {error ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
                    <p className="text-gray-900 font-medium mb-1">Gagal memuat pratinjau</p>
                    <p className="text-sm text-gray-500 mb-4">Dokumen ini tidak dapat ditampilkan di sini. Silakan unduh untuk melihatnya.</p>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                        <Button>
                            <Download className="w-4 h-4 mr-2" /> Unduh Dokumen
                        </Button>
                    </a>
                </div>
            ) : (
                <>
                    {fileType === 'pdf' && (
                        <iframe
                            src={url}
                            className="w-full h-full"
                            onLoad={handleLoad}
                            onError={handleError}
                            title={title || "PDF Viewer"}
                        />
                    )}

                    {fileType === 'office' && (
                        <iframe
                            src={googleDocsViewerUrl}
                            className="w-full h-full"
                            onLoad={handleLoad}
                            onError={handleError}
                            title={title || "Office Viewer"}
                        />
                    )}

                    {fileType === 'image' && (
                        <div className="flex items-center justify-center h-full overflow-auto bg-black/5 p-4">
                            <img
                                src={url}
                                alt={title || "Preview"}
                                className="max-w-full max-h-full object-contain shadow-md"
                                onLoad={handleLoad}
                                onError={handleError}
                            />
                        </div>
                    )}

                    {fileType === 'unknown' && (
                        <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-white">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                                <ExternalLink className="w-8 h-8 text-blue-500" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{title || 'Dokumen'}</h3>
                            <p className="text-gray-500 mb-6 max-w-sm">
                                Pratinjau tidak tersedia untuk jenis file ini. Silakan unduh file untuk membukanya.
                            </p>
                            <a href={url} target="_blank" rel="noopener noreferrer">
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    <Download className="w-4 h-4 mr-2" /> Unduh File
                                </Button>
                            </a>
                        </div>
                    )}
                </>
            )}

            {/* Overlay warning for localhost + Office */}
            {fileType === 'office' && window.location.hostname === 'localhost' && (
                <div className="absolute top-0 left-0 right-0 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 text-center border-b border-yellow-200">
                    Note: Office preview via Google Docs might not work on localhost.
                </div>
            )}
        </div>
    );
}
