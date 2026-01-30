import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Loader2 } from 'lucide-react';

export function PremiumGuard({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const [isPremium, setIsPremium] = useState(false);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const { user, profile } = await authService.getCurrentUser() || {};
            const activeProfile = profile || user;

            if ((activeProfile as any)?.premium_until && new Date((activeProfile as any).premium_until) > new Date()) {
                setIsPremium(true);
            } else {
                setIsPremium(false);
            }
        } catch (error) {
            console.error(error);
            setIsPremium(false);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary-600" /></div>;
    }

    if (!isPremium) {
        return <Navigate to="/member/upgrade" replace />;
    }

    return <>{children}</>;
}
