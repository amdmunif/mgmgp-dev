import { Settings, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Maintenance() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-6">
                <div className="flex justify-center mb-6 relative">
                    <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center">
                        <Wrench className="w-12 h-12 text-orange-500 animate-bounce" />
                    </div>
                    <div className="absolute top-0 right-1/4">
                        <Settings className="w-8 h-8 text-gray-400 animate-spin-slow" />
                    </div>
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900">Under Maintenance</h1>
                
                <p className="text-gray-600">
                    Sistem saat ini sedang dalam masa pemeliharaan rutin atau pembaruan fitur. Kami akan segera kembali beroperasi normal.
                </p>
                
                <div className="pt-6 border-t border-gray-100">
                    <p className="text-sm text-gray-500 mb-4">Mohon maaf atas ketidaknyamanan ini.</p>
                    <Link to="/login" className="text-sm text-blue-600 hover:underline">
                        Login sebagai Admin
                    </Link>
                </div>
            </div>
        </div>
    );
}
