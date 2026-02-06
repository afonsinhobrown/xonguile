import { X, QrCode } from 'lucide-react';
import { clsx } from 'clsx';

interface XonguileCardProps {
    name: string;
    xonguileId: string;
    onClose: () => void;
}

export function XonguileCard({ name, xonguileId, onClose }: XonguileCardProps) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=111827&data=XONGUILE_ID:${xonguileId}`;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden aspect-[1.6/1] flex flex-col p-8 md:p-12 border border-gray-100">

                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -ml-32 -mb-32 opacity-50"></div>

                <header className="relative z-10 flex justify-between items-start">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600 mb-1">Cartão Digital</p>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Xonguile<span className="text-purple-600">ID</span></h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center hover:bg-black transition-all active:scale-95 shadow-lg"
                    >
                        <X size={24} />
                    </button>
                </header>

                <div className="relative z-10 mt-auto flex justify-between items-end">
                    <div className="space-y-6">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Titular</p>
                            <p className="text-xl md:text-2xl font-black text-gray-900 uppercase leading-tight max-w-[280px]">
                                {name}
                            </p>
                        </div>

                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">ID Único</p>
                            <p className="text-2xl font-black text-purple-600 tracking-wider">
                                {xonguileId}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-3 rounded-3xl border-2 border-gray-50 shadow-xl">
                        <img
                            src={qrUrl}
                            alt="QR Code"
                            className="w-24 h-24 md:w-32 md:h-32"
                            crossOrigin="anonymous"
                        />
                    </div>
                </div>

                {/* Brand Identifier */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-black text-gray-300 uppercase tracking-[0.5em]">
                    Xonguile Network Authentication
                </div>
            </div>
        </div>
    );
}
