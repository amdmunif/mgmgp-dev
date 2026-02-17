import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./button";
import { AlertTriangle } from "lucide-react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
                    <div className="bg-red-50 p-4 rounded-full mb-4">
                        <AlertTriangle className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Terjadi Kesalahan</h2>
                    <p className="text-gray-600 mb-6 max-w-md">
                        Maaf, terjadi kesalahan saat memuat halaman ini. Silakan coba muat ulang atau kembali ke beranda.
                    </p>
                    <div className="bg-gray-100 p-4 rounded-lg mb-6 w-full max-w-lg overflow-auto text-left">
                        <p className="text-xs font-mono text-red-600 break-words">
                            {this.state.error?.toString()}
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Button onClick={() => window.location.reload()} variant="outline">
                            Muat Ulang
                        </Button>
                        <Button onClick={() => window.history.back()}>
                            Kembali
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
