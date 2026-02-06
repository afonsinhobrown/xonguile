import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import {
    Users as UsersIcon, Store, CreditCard, Shield, Plus,
    CheckCircle, XCircle, MoreVertical, Edit, Search, UserPlus, Banknote, Mail, ArrowRight,
    AlertTriangle
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

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Search className="animate-spin text-purple-600" size={40} />
                </div>
            ) : (
                <>
                    {/* STATS SUMMARY */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                        <StatCard icon={<Store className="text-blue-600" />} label="Salões Totais" value={stats?.totalSalons || 0} />
                        <StatCard icon={<CheckCircle className="text-emerald-600" />} label="Salões Ativos" value={stats?.activeSalons || 0} />
                        <StatCard icon={<CreditCard className="text-purple-600" />} label="Receita Licenças" value={`MZN ${stats?.licenseRevenue?.toLocaleString() || 0}`} />
                        <StatCard icon={<Banknote className="text-indigo-600" />} label="GMV Ecossistema" value={`MZN ${stats?.totalGmv?.toLocaleString() || 0}`} />
                    </div>

                    {activeTab === 'salons' && (
                        <div className="bg-white rounded-[2rem] border border-gray-200 overflow-hidden shadow-sm h-[600px] flex flex-col">
                            <div className="overflow-y-auto flex-1">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50/50 border-b border-gray-100 sticky top-0">
                                        <tr>
                                            <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Salão</th>
                                            <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Admin</th>
                                            <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Plano</th>
                                            <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Estado</th>
                                            <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {salons.map(s => {
                                            const admin = (s.Users || [])?.find?.((u: any) => u.role === 'admin');
                                            const isActive = s.License?.status === 'active';
                                            return (
                                                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group">
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-purple-600/20">
                                                                {s.name[0]}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-gray-800 leading-tight">{s.name}</p>
                                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">slug: {s.slug}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <p className="text-sm font-bold text-gray-700">{admin?.name || '---'}</p>
                                                        <p className="text-xs text-gray-400 font-medium">{admin?.email || '---'}</p>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <span className={clsx(
                                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
                                                            s.License?.type === 'trial' ? 'bg-amber-100 text-amber-700' :
                                                                s.License?.type?.includes('premium') ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                                        )}>
                                                            {s.License?.type || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div className={clsx("w-2 h-2 rounded-full", isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500')} />
                                                            <span className={clsx("text-xs font-black uppercase", isActive ? 'text-emerald-600' : 'text-red-600')}>
                                                                {isActive ? 'ATIVO' : 'BLOQUEADO'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex justify-end gap-2">
                                                            {isActive ? (
                                                                <button
                                                                    onClick={() => handleUpdateLicense(s.id, { status: 'suspended' })}
                                                                    className="px-4 py-2 bg-red-100 text-red-700 rounded-xl font-bold text-xs hover:bg-red-200 transition-colors"
                                                                >
                                                                    Desativar
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleUpdateLicense(s.id, { status: 'active' })}
                                                                    className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl font-bold text-xs hover:bg-emerald-200 transition-colors"
                                                                >
                                                                    Ativar
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'finance' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-black text-gray-900">Histórico de Receitas (Licenças)</h2>
                            <div className="bg-white p-8 rounded-[2rem] border border-gray-200 text-center py-20">
                                <CreditCard size={48} className="mx-auto text-gray-200 mb-4" />
                                <p className="text-gray-400 font-bold">Módulo de faturamento detalhado em desenvolvimento.</p>
                                <p className="text-xs text-gray-300 mt-1 uppercase tracking-widest font-black">GMV TOTAL ATUAL: MZN {stats?.totalGmv?.toLocaleString()}</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'supers' && (
                        <div className="max-w-md bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-xl">
                            <h3 className="text-xl font-black mb-8 flex items-center gap-2 text-gray-800">
                                <UserPlus className="text-purple-600" />
                                Criar Assistente Super (Nivel 2)
                            </h3>
                            <form className="space-y-5" onSubmit={async (e: any) => {
                                e.preventDefault();
                                const formData = new FormData(e.target);
                                try {
                                    await api.createSuperAssistant(Object.fromEntries(formData));
                                    alert('Assistente criado com sucesso!');
                                    e.target.reset();
                                } catch (e) { alert('Erro ao criar assistente'); }
                            }}>
                                <Input label="Nome Completo" name="name" required />
                                <Input label="Email de Gestão" name="email" type="email" required />
                                <Input label="Senha Temporária" name="password" type="password" required />
                                <Button className="w-full py-4 text-lg font-bold shadow-xl shadow-purple-600/20 mt-4">Criar Acesso</Button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-8">
                            <div className="bg-white p-10 rounded-[2.5rem] border border-gray-200 max-w-2xl">
                                <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
                                    <Shield className="text-purple-600" /> Configurações de Plataforma
                                </h3>
                                <div className="space-y-6">
                                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                        <p className="font-black text-gray-800 mb-1">Taxas de Serviço (Online)</p>
                                        <p className="text-xs text-gray-400 font-medium mb-4">Define a taxa padrão para novos salões</p>
                                        <Input label="Comissão Xonguile (%)" defaultValue="0" />
                                    </div>
                                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 opacity-50">
                                        <p className="font-black text-gray-800 mb-1">Gateways de Pagamento Ativos</p>
                                        <div className="flex gap-4 mt-4">
                                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200">
                                                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                                                <span className="text-xs font-bold uppercase tracking-widest">PayPal</span>
                                            </div>
                                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 grayscale">
                                                <div className="w-3 h-3 bg-gray-300 rounded-full" />
                                                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">M-Pesa</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                    )}
                            {activeTab === 'emails' && (
                                <div className="space-y-8 animate-in fade-in duration-500">
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Gestão de Emails</h2>
                                    <SuperAdminEmails />
                                </div>
                            )}

                            {activeTab === 'tickets' && (
                                <div className="space-y-8 animate-in fade-in duration-500">
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Gestão de Suporte (Tickets)</h2>
                                    <SuperAdminTickets />
                                </div>
                            )}

                            {activeTab === 'communications' && (
                                <div className="space-y-8 animate-in fade-in duration-500">
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Central de Comunicação</h2>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Email Sender Card */}
                                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-xl overflow-hidden relative">
                                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                                <Mail size={120} />
                                            </div>
                                            <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-gray-800">
                                                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                                    <Mail size={20} />
                                                </div>
                                                Enviar E-mail em Massa
                                            </h3>

                                            <form className="space-y-5" onSubmit={async (e: any) => {
                                                e.preventDefault();
                                                const formData = new FormData(e.target);
                                                const payload = Object.fromEntries(formData);
                                                try {
                                                    setLoading(true);
                                                    const res = await api.sendBulkEmail(payload);
                                                    alert(`E-mail enviado com sucesso para ${res.count} destinatários!`);
                                                    e.target.reset();
                                                } catch (e) {
                                                    alert('Erro ao enviar e-mail.');
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}>
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Destinatários</label>
                                                    <select name="target" className="w-full h-12 bg-gray-50 border border-gray-100 rounded-2xl px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-purple-400 transition-all appearance-none">
                                                        <option value="all_salons">Todos os Salões (Donos)</option>
                                                        <option value="all_clients">Todos os Clientes (Base Global)</option>
                                                        <option value="active_licenses">Apenas Salões Ativos</option>
                                                        <option value="expired_licenses">Apenas Salões Expirados</option>
                                                        <option value="custom">Lista Personalizada (Manual)</option>
                                                    </select>
                                                </div>

                                                <Input label="Assunto do E-mail" name="subject" placeholder="Ex: Manutenção Programada" required />

                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Corpo da Mensagem (HTML Suportado)</label>
                                                    <textarea
                                                        name="message"
                                                        rows={6}
                                                        className="w-full bg-gray-50 border border-gray-100 rounded-3xl p-5 font-medium text-sm outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                                                        placeholder="Olá, informamos que..."
                                                        required
                                                    ></textarea>
                                                </div>

                                                <div className="pt-2">
                                                    <Button className="w-full py-4 text-lg font-black shadow-2xl shadow-purple-600/30 rounded-2xl group">
                                                        <span>Disparar E-mails</span>
                                                        <Mail size={18} className="inline ml-2 group-hover:translate-x-1 transition-transform" />
                                                    </Button>
                                                </div>
                                            </form>
                                        </div>

                                        {/* Quick Templates & Stats */}
                                        <div className="space-y-6">
                                            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                                                <div className="relative z-10">
                                                    <h4 className="text-lg font-black mb-1">Estatísticas de Envio</h4>
                                                    <p className="text-indigo-100 text-xs mb-6">Mantenha a sua base informada e engajada.</p>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                                                            <p className="text-[10px] uppercase font-black opacity-60">Total Enviados</p>
                                                            <p className="text-2xl font-black">1.240</p>
                                                        </div>
                                                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                                                            <p className="text-[10px] uppercase font-black opacity-60">Taxa de Abertura</p>
                                                            <p className="text-2xl font-black">64%</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="absolute -bottom-10 -right-10 opacity-10">
                                                    <Sparkles size={200} />
                                                </div>
                                            </div>

                                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200">
                                                <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6">Modelos Rápidos</h4>
                                                <div className="space-y-3">
                                                    <QuickTemplate
                                                        title="Manutenção do Sistema"
                                                        desc="Avisa sobre indisponibilidade técnica."
                                                        onClick={() => { }}
                                                    />
                                                    <QuickTemplate
                                                        title="Novidade: App Mobile"
                                                        desc="Anúncio do lançamento da app nativa."
                                                        onClick={() => { }}
                                                    />
                                                    <QuickTemplate
                                                        title="Aviso de Expiração"
                                                        desc="Lembrete de pagamento para salões."
                                                        onClick={() => { }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
}

                    function QuickTemplate({title, desc, onClick}: any) {
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

                    function TabBtn({active, onClick, label}: any) {
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

                    function StatCard({icon, label, value}: any) {
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
