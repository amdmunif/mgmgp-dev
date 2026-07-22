import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { settingsService, type AppSettings } from '../../services/settingsService';
import { authService } from '../../services/authService';
import { Loader2 } from 'lucide-react';

type MaintenanceType = 'public' | 'member' | 'premium';

export function MaintenanceGuard({ children, type }: { children: React.ReactNode, type: MaintenanceType }) {
    const [loading, setLoading] = useState(true);
    const [isMaintenance, setIsMaintenance] = useState(false);

    useEffect(() => {
        checkStatus();
    }, [type]);

    const checkStatus = async () => {
        try {
            const [settings, authData] = await Promise.all([
                settingsService.getSettings(),
                authService.getCurrentUser()
            ]);

            // Admins bypass maintenance mode
            const activeProfile = authData?.profile || authData?.user;
            if (activeProfile && activeProfile.role === 'Admin') {
                setIsMaintenance(false);
                setLoading(false);
                return;
            }

            // Check maintenance flags
            if (type === 'public' && settings.maintenance_public) {
                setIsMaintenance(true);
            } else if (type === 'member' && settings.maintenance_member) {
                setIsMaintenance(true);
            } else if (type === 'premium' && settings.maintenance_premium) {
                setIsMaintenance(true);
            } else {
                setIsMaintenance(false);
            }
        } catch (error) {
            console.error(error);
            setIsMaintenance(false); // Default to false if error to prevent accidental lockouts
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-12 flex justify-center items-center min-h-screen bg-gray-50"><Loader2 className="animate-spin text-primary-600 w-8 h-8" /></div>;
    }

    if (isMaintenance) {
        return <Navigate to="/maintenance" replace />;
    }

    return <>{children}</>;
}
