import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import {
    Users as UsersIcon, Store, CreditCard, Shield, Plus,
    CheckCircle, XCircle, MoreVertical, Edit, Search, UserPlus, Banknote, Mail, ArrowRight,
    Sparkles, AlertTriangle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { DateTime } from 'luxon';
import { clsx } from 'clsx';
import SuperAdminEmails from '../components/SuperAdminEmails';
import SuperAdminTickets from '../components/SuperAdminTickets';

export default function SuperAdminPage() {
    const [salons, setSalons] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'salons' | 'finance' | 'supers' | 'settings' | 'communications' | 'emails' | 'tickets'>('salons');
    const user = JSON.parse(localStorage.getItem('salao_user') || '{}');
    const isSuper = user.role?.startsWith('super_');

    const loadData = async () => {
        if (!isSuper) return; // Safety
        setLoading(true);
        try {
            const [salonsData, statsData] = await Promise.all([
                api.getSuperSalons(),
                api.getSuperStats()
            ]);
            setSalons(Array.isArray(salonsData) ? salonsData : []);
            setStats(statsData || null);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    if (!isSuper) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-10">
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-red-100/50">
                    <AlertTriangle size={40} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Acesso Negado</h2>
                <p className="text-gray-500 mt-2 max-w-sm">Deverás estar logado como Super Administrador para aceder a esta área global do sistema.</p>
                <Button className="mt-8" onClick={() => window.location.href = '/admin'}>Voltar ao Painel Pessoal</Button>
            </div>
        );
    }


    const handleUpdateLicense = async (salonId: number, data: any) => {
        if (!confirm('Deseja atualizar esta licença?')) return;
        try {
            await api.updateSuperLicense(salonId, data);
            alert('Sucesso!');
            loadData();
        } catch (e) {
            alert('Falha ao atualizar');
        }
    };

    const handleImpersonate = async (salonId: number) => {
        if (!confirm('Deseja entrar neste salão como administrador?')) return;
        try {
            const adminData = await api.impersonateSalon(salonId);
            // Preserve master session flag
            if (user.isMaster) {
                adminData.isMaster = true;
                localStorage.setItem('is_master', 'true');
            }
            localStorage.setItem('salao_user', JSON.stringify(adminData));
            window.location.href = '/admin'; // Redirect and force reload
        } catch (e) {
            alert('Falha ao entrar no salão');
        }
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <header className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Painel Administrativo</h1>
                    <p className="text-gray-500">Gestão global do ecossistema Xonguile App</p>
                </div>
                <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
                    <TabBtn active={activeTab === 'salons'} onClick={() => setActiveTab('salons')} label="Salões" />
                    <TabBtn active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} label="Financeiro" />
                    <TabBtn active={activeTab === 'supers'} onClick={() => setActiveTab('supers')} label="Equipa Super" />
                    <TabBtn active={activeTab === 'emails'} onClick={() => setActiveTab('emails')} label="Emails" />
                    <TabBtn active={activeTab === 'tickets'} onClick={() => setActiveTab('tickets')} label="Tickets" />
                    <TabBtn active={activeTab === 'communications'} onClick={() => setActiveTab('communications')} label="Comunicação" />
                    {user.role === 'super_level_1' && (
                        <TabBtn active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} label="Configurações" />
                    )}
                </div>
            </header>

            <div className="mt-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Search className="animate-spin text-purple-600" size={40} />
                    </div>
                ) : (
                    <>
                        <div className="mb-6">
                            <StatCard icon={<Store className="text-blue-600" />} label="Salões Totais" value={stats?.totalSalons || 0} />
                        </div>

                        {activeTab === 'emails' && (
                            <div className="space-y-8">
                                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Gestão de Emails</h2>
                                <SuperAdminEmails />
                            </div>
                        )}

                        {activeTab === 'tickets' && (
                            <div className="space-y-8">
                                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Gestão de Suporte (Tickets)</h2>
                                <SuperAdminTickets />
                            </div>
                        )}

                        {activeTab === 'salons' && (
                            <div className="bg-white rounded-[2rem] border border-gray-200 p-6">Lista de salões carregada ({salons.length})</div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function QuickTemplate({ title, desc, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-purple-300 hover:bg-purple-50 transition-all group text-left"
        >
            <div>
                <p className="text-sm font-black text-gray-800">{title}</p>
                <p className="text-[10px] text-gray-400 font-medium">{desc}</p>
            </div>
            <ArrowRight size={16} className="text-gray-300 group-hover:text-purple-600 transition-colors" />
        </button>
    );
}

function TabBtn({ active, onClick, label }: any) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                active ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30" : "text-gray-400 hover:text-gray-600"
            )}
        >
            {label}
        </button>
    );
}

function StatCard({ icon, label, value }: any) {
    return (
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                <p className="text-xl font-black text-gray-900 tracking-tight">{value}</p>
            </div>
        </div>
    );
}
