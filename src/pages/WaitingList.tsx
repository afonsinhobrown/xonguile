import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Clock, User, CheckCircle, XCircle, PlayCircle, Loader2, Sparkles } from 'lucide-react';
import { DateTime } from 'luxon';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';

export default function WaitingListPage() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('salao_user') || '{}');
    const license = user?.salon?.License || {};
    const isPremium = license.hasWaitingList;

    const loadDailyApps = async () => {
        setLoading(true);
        try {
            const data = await api.getAppointments();
            const today = DateTime.now().toISODate();
            // Filter only today's apps
            const filtered = data.filter((a: any) => a.date === today);
            setAppointments(filtered);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDailyApps();
        const interval = setInterval(loadDailyApps, 30000); // Auto refresh
        return () => clearInterval(interval);
    }, []);

    if (!isPremium) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50">
                <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-100">
                    <Sparkles size={40} />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Fila de Espera Digital</h2>
                <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">
                    Esta funcionalidade exclusiva permite gerir o fluxo de clientes em tempo real (em atendimento, em espera e faltas).
                </p>
                <Link to="/admin/configuracoes" className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all">
                    Upgrade para Premium
                </Link>
            </div>
        );
    }

    const waiting = appointments.filter(a => a.status === 'scheduled');
    const inService = appointments.filter(a => a.status === 'in_service' || (a.status === 'scheduled' && a.startTime <= DateTime.now().toFormat('HH:mm') && a.startTime > DateTime.now().minus({ minutes: 30 }).toFormat('HH:mm')));
    // status 'in_service' doesn't exist yet, I'll simulate or use status
    const completed = appointments.filter(a => a.status === 'completed');
    const cancelled = appointments.filter(a => a.status === 'cancelled');

    return (
        <div className="p-8 bg-gray-50 min-h-full">
            <header className="mb-10 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Fila de Atendimento</h1>
                    <p className="text-gray-500">Monitorização em tempo real para hoje, {DateTime.now().toFormat('dd/MM/yyyy')}</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                    LIVE
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* COL 1: EM ESPERA */}
                <div className="space-y-4">
                    <h3 className="flex items-center gap-2 font-black text-gray-400 uppercase tracking-widest text-xs px-2">
                        <Clock size={16} /> Em Espera ({waiting.length})
                    </h3>
                    <div className="space-y-3">
                        {waiting.map(a => <WaitingItem key={a.id} app={a} status="waiting" />)}
                        {waiting.length === 0 && <EmptyState type="espera" />}
                    </div>
                </div>

                {/* COL 2: EM ATENDIMENTO */}
                <div className="space-y-4">
                    <h3 className="flex items-center gap-2 font-black text-indigo-600 uppercase tracking-widest text-xs px-2">
                        <PlayCircle size={16} /> Em Atendimento ({inService.length})
                    </h3>
                    <div className="space-y-3">
                        {inService.map(a => <WaitingItem key={a.id} app={a} status="active" />)}
                        {inService.length === 0 && <EmptyState type="atendimento" />}
                    </div>
                </div>

                {/* COL 3: CONCLUÍDOS / FALTAS */}
                <div className="space-y-4">
                    <h3 className="flex items-center gap-2 font-black text-gray-700 uppercase tracking-widest text-xs px-2">
                        <CheckCircle size={16} /> Finalizados & Faltas
                    </h3>
                    <div className="space-y-3">
                        {completed.map(a => <WaitingItem key={a.id} app={a} status="done" />)}
                        {cancelled.map(a => <WaitingItem key={a.id} app={a} status="noshow" />)}
                        {completed.length === 0 && cancelled.length === 0 && <EmptyState type="finalizados" />}
                    </div>
                </div>

            </div>
        </div>
    );
}

function WaitingItem({ app, status }: { app: any, status: 'waiting' | 'active' | 'done' | 'noshow' }) {
    return (
        <div className={clsx(
            "bg-white p-5 rounded-3xl border transition-all shadow-sm",
            status === 'active' ? "border-indigo-200 bg-indigo-50/30 ring-2 ring-indigo-500/20" : "border-gray-100"
        )}>
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className={clsx(
                        "w-10 h-10 rounded-2xl flex items-center justify-center font-bold",
                        status === 'active' ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"
                    )}>
                        {app.Client?.name?.[0] || '?'}
                    </div>
                    <div>
                        <p className="font-bold text-gray-800 leading-tight">{app.Client?.name || 'Cliente Externo'}</p>
                        <p className="text-xs text-gray-400 font-medium">{app.Service?.name || 'Serviço'}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-black text-gray-800 text-sm">{app.startTime}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Início</p>
                </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1.5">
                    <User size={12} className="text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase">{app.Professional?.name || '---'}</span>
                </div>
                {status === 'active' && <span className="text-[10px] font-black text-indigo-600 animate-pulse">ATENDENDO</span>}
                {status === 'noshow' && <span className="text-[10px] font-black text-red-500">FALTOU</span>}
            </div>
        </div>
    );
}

function EmptyState({ type }: { type: string }) {
    return (
        <div className="p-10 text-center border-2 border-dashed border-gray-200 rounded-3xl">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ninguém em {type}</p>
        </div>
    );
}
