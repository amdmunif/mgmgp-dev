import { useState, useMemo } from 'react';
import { Button } from './button';
import { ChevronLeft, ChevronRight, Search, ArrowUpDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DataTableProps<T> {
    data: T[];
    columns: {
        header: string;
        accessorKey?: keyof T;
        cell?: (item: T) => React.ReactNode;
        className?: string; // Additional classes for TH and TD
    }[];
    searchKeys?: (keyof T)[]; // keys to search in
    pageSize?: number;
    filterContent?: React.ReactNode; // Optional slot for filters
}

export function DataTable<T extends Record<string, any>>({
    data,
    columns,
    searchKeys = [],
    pageSize = 10,
    filterContent
}: DataTableProps<T>) {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof T | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });

    // Filter
    const filteredData = useMemo(() => {
        let result = data;

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter((item) =>
                searchKeys.some((key) => {
                    const val = item[key];
                    return String(val).toLowerCase().includes(lowerTerm);
                })
            );
        }

        // Additional filtering logic is handled by parent passing filtered 'data', 
        // but if we needed internal filtering we could add it here.
        // For now, we rely on parent filtering for complex filters (mapel, kelas etc) 
        // OR the parent passes pre-filtered data. 
        // Actually, if parent passes pre-filtered data, Global Search might work on THAT subset.

        return result;
    }, [data, searchTerm, searchKeys]);

    // Sort
    const sortedData = useMemo(() => {
        if (!sortConfig.key) return filteredData;

        return [...filteredData].sort((a, b) => {
            const aVal = a[sortConfig.key!] ?? '';
            const bVal = b[sortConfig.key!] ?? '';

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortConfig]);

    // Pagination
    const totalPages = Math.ceil(sortedData.length / pageSize);
    const paginatedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handleSort = (key: keyof T) => {
        setSortConfig((current) => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    return (
        <div className="space-y-4">
            {/* Search Bar & Filters */}
            {(searchKeys.length > 0 || filterContent) && (
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    {searchKeys.length > 0 && (
                        <div className="relative flex-1 w-full sm:max-w-sm">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari data..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm bg-gray-50"
                            />
                        </div>
                    )}

                    {filterContent && (
                        <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
                            {filterContent}
                        </div>
                    )}
                </div>
            )}

            {/* Table */}
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm mt-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                {columns.map((col, idx) => (
                                    <th
                                        key={idx}
                                        className={cn(
                                            "px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none",
                                            col.className
                                        )}
                                        onClick={() => col.accessorKey && handleSort(col.accessorKey)}
                                    >
                                        <div className="flex items-center gap-1">
                                            {col.header}
                                            {col.accessorKey && <ArrowUpDown className="h-3 w-3 text-gray-400" />}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedData.length > 0 ? (
                                paginatedData.map((item, rowIdx) => (
                                    <tr key={rowIdx} className="hover:bg-gray-50/80 transition-colors">
                                        {columns.map((col, colIdx) => (
                                            <td key={colIdx} className={cn("px-6 py-4 text-sm text-gray-600", col.className)}>
                                                {col.cell ? col.cell(item) : (item[col.accessorKey!] as React.ReactNode)}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                                        Tidak ada data yang ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                    <p className="text-sm text-gray-500">
                        Halaman {currentPage} dari {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
