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

            <div className="mt-6 overflow-y-auto h-[calc(100vh-200px)]">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Search className="animate-spin text-purple-600" size={40} />
                    </div>
                ) : (
                    <div className="pr-4">
                        {/* STATS */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <StatCard icon={<Store className="text-blue-600" />} label="Salões Totais" value={stats?.totalSalons || 0} />
                            <StatCard icon={<CheckCircle className="text-emerald-600" />} label="Ativos" value={stats?.activeSalons || 0} />
                            <StatCard icon={<CreditCard className="text-purple-600" />} label="Receita" value={`MZN ${stats?.licenseRevenue?.toLocaleString() || 0}`} />
                            <StatCard icon={<Banknote className="text-indigo-600" />} label="GMV" value={`MZN ${stats?.totalGmv?.toLocaleString() || 0}`} />
                        </div>

                        {/* EMAILS TAB */}
                        {activeTab === 'emails' && (
                            <div className="space-y-8 pb-12">
                                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Gestão de Emails</h2>
                                <SuperAdminEmails />
                            </div>
                        )}

                        {/* TICKETS TAB */}
                        {activeTab === 'tickets' && (
                            <div className="space-y-8 pb-12">
                                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Gestão de Suporte (Tickets)</h2>
                                <SuperAdminTickets />
                            </div>
                        )}

                        {/* SALONS TAB */}
                        {activeTab === 'salons' && (
                            <div className="space-y-6 pb-12">
                                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Gestão de Salões</h2>
                                <div className="bg-white rounded-[2rem] border border-gray-200 overflow-x-auto shadow-sm">
                                    <div className="min-w-max">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                                                <tr>
                                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">Salão</th>
                                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">Admin</th>
                                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">Plano</th>
                                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">Estado</th>
                                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {salons.map(s => {
                                                    const admin = s.Users?.find((u: any) => u.role === 'admin');
                                                    const isActive = s.License?.status === 'active';
                                                    return (
                                                        <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white font-black text-sm">
                                                                        {s.name[0]}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-gray-800">{s.name}</p>
                                                                        <p className="text-xs text-gray-400">{s.slug}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <p className="text-sm font-bold text-gray-700">{admin?.name || '---'}</p>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className={clsx(
                                                                    "px-3 py-1 rounded-full text-xs font-bold",
                                                                    s.License?.type === 'trial' ? 'bg-amber-100 text-amber-700' :
                                                                        s.License?.type?.includes('premium') ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                                                )}>
                                                                    {s.License?.type || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <div className="flex items-center justify-center gap-1">
                                                                    <div className={clsx("w-2 h-2 rounded-full", isActive ? 'bg-emerald-500' : 'bg-red-500')} />
                                                                    <span className={clsx("text-xs font-bold", isActive ? 'text-emerald-600' : 'text-red-600')}>
                                                                        {isActive ? 'ATIVO' : 'BLOQ'}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <button
                                                                    onClick={() => handleUpdateLicense(s.id, { status: isActive ? 'suspended' : 'active' })}
                                                                    className={clsx(
                                                                        "px-3 py-1 rounded-lg text-xs font-bold transition-colors",
                                                                        isActive ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                                    )}
                                                                >
                                                                    {isActive ? 'Desativar' : 'Ativar'}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* FINANCE TAB */}
                        {activeTab === 'finance' && (
                            <div className="space-y-6 pb-12">
                                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Financeiro</h2>
                                <div className="bg-white p-8 rounded-[2rem] border border-gray-200 text-center py-20">
                                    <CreditCard size={40} className="mx-auto text-gray-300 mb-4" />
                                    <p className="text-gray-500 font-bold">Módulo em desenvolvimento</p>
                                </div>
                            </div>
                        )}

                        {/* SUPERS TAB */}
                        {activeTab === 'supers' && (
                            <div className="space-y-6 pb-12">
                                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Equipa Super</h2>
                                <div className="max-w-md bg-white p-8 rounded-[2rem] border border-gray-200">
                                    <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                                        <UserPlus className="text-purple-600" size={20} /> Criar Assistente Super
                                    </h3>
                                    <form className="space-y-4" onSubmit={async (e: any) => {
                                        e.preventDefault();
                                        const formData = new FormData(e.target);
                                        try {
                                            await api.createSuperAssistant(Object.fromEntries(formData));
                                            alert('Assistente criado com sucesso!');
                                            e.target.reset();
                                        } catch (e) {
                                            alert('Erro ao criar assistente');
                                        }
                                    }}>
                                        <Input label="Nome Completo" name="name" required />
                                        <Input label="Email" name="email" type="email" required />
                                        <Input label="Senha" name="password" type="password" required />
                                        <Button className="w-full py-3 text-md font-bold">Criar</Button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* COMMUNICATIONS TAB */}
                        {activeTab === 'communications' && (
                            <div className="space-y-8 pb-12">
                                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Comunicação</h2>
                                <div className="space-y-6">
                                    <div className="bg-white p-8 rounded-[2rem] border border-gray-200">
                                        <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                                            <Mail className="text-purple-600" size={20} /> Enviar Email em Massa
                                        </h3>
                                        <form className="space-y-4" onSubmit={async (e: any) => {
                                            e.preventDefault();
                                            const formData = new FormData(e.target);
                                            try {
                                                setLoading(true);
                                                const res = await api.sendBulkEmail(Object.fromEntries(formData));
                                                alert(`Email enviado para ${res.count} destinatários!`);
                                                e.target.reset();
                                            } catch (e) {
                                                alert('Erro ao enviar email');
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}>
                                            <Input label="Assunto" name="subject" placeholder="Ex: Manutenção" required />
                                            <textarea
                                                name="message"
                                                placeholder="Mensagem..."
                                                rows={4}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-400"
                                                required
                                            ></textarea>
                                            <Button className="w-full py-3 font-bold">Enviar</Button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SETTINGS TAB */}
                        {activeTab === 'settings' && user.role === 'super_level_1' && (
                            <div className="space-y-6 pb-12">
                                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Configurações</h2>
                                <div className="max-w-2xl bg-white p-8 rounded-[2rem] border border-gray-200">
                                    <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                                        <Shield className="text-purple-600" size={20} /> Configurações de Plataforma
                                    </h3>
                                    <div className="space-y-4">
                                        <Input label="Taxa de Comissão (%)" type="number" defaultValue="0" />
                                        <Button className="w-full py-3 font-bold">Guardar</Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
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
