import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import { Button } from "./ui/Button";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 text-center border border-gray-100">
                        <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle size={40} />
                        </div>

                        <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Ops! Algo correu mal.</h1>
                        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
                            O sistema encontrou um erro inesperado. Não te preocupes, os teus dados estão seguros.
                        </p>

                        <div className="space-y-3">
                            <Button
                                onClick={() => window.location.reload()}
                                className="w-full py-4 text-lg font-bold flex items-center justify-center gap-2"
                            >
                                <RefreshCcw size={20} />
                                Tentar Novamente
                            </Button>

                            <Button
                                variant="secondary"
                                onClick={() => window.location.href = '/admin'}
                                className="w-full py-4 text-lg font-bold flex items-center justify-center gap-2"
                            >
                                <Home size={20} />
                                Voltar ao Início
                            </Button>
                        </div>

                        <p className="mt-8 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            Xonguile App • Suporte em Tempo Real Ativo
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
