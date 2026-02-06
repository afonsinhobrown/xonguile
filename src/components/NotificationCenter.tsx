import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Bell, AlertCircle } from 'lucide-react';

export default function NotificationCenter() {
    const [unreadCount, setUnreadCount] = useState(0);
    const [showBell, setShowBell] = useState(false);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('salao_user') || '{}');

        // Se é super admin
        if (user.role?.startsWith('super_')) {
            const checkUnread = async () => {
                const data = await api.getUnreadTickets?.();
                setUnreadCount(data?.unreadCount || 0);
            };

            checkUnread();
            // Polling a cada 30 segundos
            const interval = setInterval(checkUnread, 30000);
            return () => clearInterval(interval);
        }
        // Se é cliente vendo seu ticket
        else if (user.xonguileId) {
            const checkMessages = async () => {
                const data = await api.getUnreadMessages?.(user.id);
                setUnreadCount(data?.unreadCount || 0);
            };

            checkMessages();
            const interval = setInterval(checkMessages, 30000);
            return () => clearInterval(interval);
        }
    }, []);

    if (unreadCount === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
            <button
                onClick={() => setShowBell(!showBell)}
                className="relative bg-red-500 text-white rounded-full p-4 shadow-lg hover:bg-red-600 transition-colors"
            >
                <Bell size={24} />
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-red-700 font-black rounded-full w-7 h-7 flex items-center justify-center text-sm">
                    {unreadCount}
                </span>
            </button>

            {showBell && (
                <div className="absolute bottom-20 right-0 bg-white rounded-xl shadow-2xl p-6 w-80 border-2 border-red-200">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertCircle size={20} className="text-red-500" />
                        <h3 className="font-black text-gray-900">Notificações</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                        Você tem <span className="font-black text-red-500">{unreadCount}</span> mensagem(ns) não lida(s)
                    </p>
                    <button
                        onClick={() => setShowBell(false)}
                        className="w-full mt-4 px-4 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-colors"
                    >
                        Verificar Agora
                    </button>
                </div>
            )}
        </div>
    );
}
