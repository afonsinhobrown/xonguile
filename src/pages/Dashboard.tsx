import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import {
    DollarSign, Calendar, TrendingUp, Users, ArrowUpRight, ArrowDownRight,
    Plus, ShoppingCart, UserPlus, Scissors, Sparkles, Banknote
} from 'lucide-react';
import { DateTime } from 'luxon';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export default function DashboardPage() {
    const today = DateTime.now();

    const [appointments, setAppointments] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [clientsCount, setClientsCount] = useState(0);

    const loadMetrics = async () => {
        // 1. Get today's appointments
        const apps = await api.getAppointments(today.toISODate() || undefined);
        setAppointments(apps);

        // 2. Get all transactions and filter for today (Client-side filtering for MVP)
        const allTrans = await api.getTransactions();
        const todaysTrans = allTrans.filter((t: any) => {
            // Assuming t.date is ISO striing or Date object
            const tDate = DateTime.fromISO(t.date || t.createdAt);
            return tDate.hasSame(today, 'day');
        });
        setTransactions(todaysTrans);

        // 3. Get clients count
        const allClients = await api.getClients();
        setClientsCount(allClients.length);
    };

    useEffect(() => {
        loadMetrics();
    }, []);

    // Metrics Calculation
    const totalRevenue = transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc, 0);
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(a => a.status === 'completed').length;
    const ticketAverage = completedAppointments > 0 ? totalRevenue / completedAppointments : 0;

    const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'MZN' }).format(val);

    return (
        <div className="flex flex-col h-full bg-gray-50 overflow-auto">
            <header className="px-8 py-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Visão Geral</h1>
                    <p className="text-gray-500">Resumo do dia {today.toFormat('dd/MM/yyyy')}</p>
                </div>
                <Button variant="secondary" onClick={() => window.print()} className="no-print border-gray-200">
                    <TrendingUp size={16} /> Exportar Relatório PDF
                </Button>
            </header>

            <div className="px-8 pb-8 space-y-8">

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard
                        title="Faturamento Hoje"
                        value={formatMoney(totalRevenue)}
                        icon={<DollarSign size={24} className="text-emerald-600" />}
                        color="bg-emerald-50 border-emerald-100"
                    />
                    <StatsCard
                        title="Agendamentos"
                        value={totalAppointments.toString()}
                        subValue={`${completedAppointments} concluídos`}
                        icon={<Calendar size={24} className="text-purple-600" />}
                        color="bg-purple-50 border-purple-100"
                    />
                    <StatsCard
                        title="Ticket Médio"
                        value={formatMoney(ticketAverage)}
                        icon={<TrendingUp size={24} className="text-blue-600" />}
                        color="bg-blue-50 border-blue-100"
                    />
                    <StatsCard
                        title="Total Clientes"
                        value={clientsCount.toString()}
                        icon={<Users size={24} className="text-orange-600" />}
                        color="bg-orange-50 border-orange-100"
                    />
                </div>

                {/* Quick Actions Section */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Plus size={18} className="text-purple-600" />
                        Ações Rápidas
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <QuickActionButton
                            to="/admin/agenda"
                            label="Agendar"
                            icon={<Calendar size={20} />}
                            color="bg-purple-50 text-purple-600 hover:bg-purple-100"
                        />
                        <QuickActionButton
                            to="/admin/caixa"
                            label="Nova Venda"
                            icon={<ShoppingCart size={20} />}
                            color="bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        />
                        <QuickActionButton
                            to="/admin/clientes"
                            label="Novo Cliente"
                            icon={<UserPlus size={20} />}
                            color="bg-sky-50 text-sky-600 hover:bg-sky-100"
                        />
                        <QuickActionButton
                            to="/admin/profissionais"
                            label="Profissional"
                            icon={<Scissors size={20} />}
                            color="bg-orange-50 text-orange-600 hover:bg-orange-100"
                        />
                        <QuickActionButton
                            to="/admin/servicos"
                            label="Novo Serviço"
                            icon={<Sparkles size={20} />}
                            color="bg-pink-50 text-pink-600 hover:bg-pink-100"
                        />
                        <QuickActionButton
                            to="/admin/financeiro"
                            label="Financeiro"
                            icon={<Banknote size={20} />}
                            color="bg-blue-50 text-blue-600 hover:bg-blue-100"
                        />
                    </div>
                </div>

                {/* Recent Activity & Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Recent Transactions List */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-bold text-gray-800 mb-4">Últimas Movimentações (Hoje)</h3>
                        <div className="space-y-4">
                            {transactions.length === 0 && (
                                <p className="text-gray-400 text-sm text-center py-8">Nenhuma venda realizada hoje.</p>
                            )}
                            {transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(t => (
                                <div key={t.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100/50">
                                    <div className="flex items-center gap-3">
                                        <div className={clsx("p-2 rounded-full", t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600')}>
                                            {t.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800 text-sm">{t.description}</p>
                                            <p className="text-xs text-gray-400 capitalize">{t.paymentMethod === 'transfer' ? 'M-Pesa/Transfer' : t.paymentMethod}</p>
                                        </div>
                                    </div>
                                    <span className={clsx("font-bold text-sm", t.type === 'income' ? 'text-emerald-600' : 'text-red-600')}>
                                        {t.type === 'income' ? '+' : '-'} {formatMoney(t.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions / Tips */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg shadow-purple-600/20">
                            <h3 className="font-bold text-lg mb-2">Dica do Dia</h3>
                            <p className="text-purple-100 text-sm leading-relaxed">
                                Confirme os agendamentos de amanhã pelo WhatsApp para reduzir faltas em até 30%.
                            </p>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="font-bold text-gray-800 mb-4">Próximos Agendamentos</h3>
                            <div className="space-y-3">
                                {appointments.filter(a => a.status === 'scheduled').slice(0, 3).map(app => (
                                    <div key={app.id} className="flex items-center gap-3 text-sm p-2 border-l-2 border-purple-400 bg-purple-50/50">
                                        <span className="font-bold text-gray-700">{app.startTime}</span>
                                        <span className="text-gray-600 truncate flex-1">
                                            {/* Client name isn't directly in appointment object from basic fetch. Ideally include it in backend query, but for now show ID or generic */}
                                            Cliente #{app.ClientId || app.clientId}
                                        </span>
                                    </div>
                                ))}
                                {appointments.filter(a => a.status === 'scheduled').length === 0 && (
                                    <p className="text-gray-400 text-xs">Agenda livre o resto do dia.</p>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

function StatsCard({ title, value, subValue, icon, color }: { title: string, value: string, subValue?: string, icon: React.ReactNode, color: string }) {
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
            <div>
                <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
                {subValue && <p className="text-xs text-green-600 mt-1 font-medium">{subValue}</p>}
            </div>
            <div className={clsx("p-3 rounded-xl", color)}>
                {icon}
            </div>
        </div>
    )
}

function QuickActionButton({ to, icon, label, color }: { to: string, icon: React.ReactNode, label: string, color: string }) {
    return (
        <Link
            to={to}
            className={clsx(
                "flex flex-col items-center justify-center p-4 rounded-xl transition-all border border-transparent shadow-sm",
                color
            )}
        >
            <div className="mb-2">
                {icon}
            </div>
            <span className="text-xs font-bold text-center">{label}</span>
        </Link>
    );
}
