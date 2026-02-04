import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import {
    Users, Store, CreditCard, Shield, Plus,
    CheckCircle, XCircle, MoreVertical, Edit, Search, UserPlus
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { DateTime } from 'luxon';
import { clsx } from 'clsx';

export default function SuperAdminPage() {
    const [salons, setSalons] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'salons' | 'finance' | 'supers' | 'settings'>('salons');
    const user = JSON.parse(localStorage.getItem('salao_user') || '{}');

    const loadData = async () => {
        setLoading(true);
        try {
            const [salonsData, statsData] = await Promise.all([
                api.getSuperSalons(),
                api.getSuperStats()
            ]);
            setSalons(salonsData);
            setStats(statsData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

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
                        <div className="bg-white rounded-[2rem] border border-gray-200 overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
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
                                        const admin = s.Users?.find((u: any) => u.role === 'admin');
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
                                                        <div className={clsx("w-2 h-2 rounded-full", s.License?.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500')} />
                                                        <span className={clsx("text-xs font-black uppercase", s.License?.status === 'active' ? 'text-emerald-600' : 'text-red-600')}>
                                                            {s.License?.status === 'active' ? 'ATIVO' : 'SUSPENSO'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex justify-end gap-2 outline-none">
                                                        <button
                                                            onClick={() => handleImpersonate(s.id)}
                                                            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
                                                            title="Entrar no Salão"
                                                        >
                                                            <Store size={18} />
                                                        </button>
                                                        <select
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                if (val === 'suspend') handleUpdateLicense(s.id, { status: 'suspended' });
                                                                else if (val === 'active') handleUpdateLicense(s.id, { status: 'active' });
                                                                else handleUpdateLicense(s.id, { type: val, status: 'active', validUntil: DateTime.now().plus({ months: 1 }).toJSDate() });
                                                            }}
                                                            defaultValue=""
                                                            className="text-xs font-bold border-gray-100 rounded-xl bg-gray-50 focus:ring-2 focus:ring-purple-600/20"
                                                        >
                                                            <option value="" disabled>Ações</option>
                                                            <option value="active">Ativar Acesso</option>
                                                            <option value="standard_month">Mover p/ Standard</option>
                                                            <option value="gold_month">Mover p/ Gold</option>
                                                            <option value="premium_month">Mover p/ Premium</option>
                                                            <option value="suspend" className="text-red-600 uppercase font-black">BLOQUEAR</option>
                                                        </select>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
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
                        </div>
                    )}
                </>
            )}
        </div>
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
