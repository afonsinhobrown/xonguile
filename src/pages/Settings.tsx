import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
    Save, Building, Receipt, Users as UsersIcon, Trash2, Plus, Upload,
    Sparkles, CheckCircle, Loader2, Shield, Lock, CreditCard, FileText
} from 'lucide-react';
import { clsx } from 'clsx';
import { useForm } from 'react-hook-form';
import { DateTime } from 'luxon';
import { Link } from 'react-router-dom';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'salon' | 'users' | 'plans' | 'reports'>('salon');
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [salon, setSalon] = useState<any>({});
    const currentUser = JSON.parse(localStorage.getItem('salao_user') || '{}');
    const license = salon?.License || salon?.license || {};

    useEffect(() => {
        if (license.status && license.status !== 'active' && activeTab !== 'plans' && activeTab !== 'reports') {
            setActiveTab('plans');
        }
    }, [license, activeTab]);

    // Salon Form
    const { register: registerSalon, handleSubmit: handleSalon, setValue: setSalonValue } = useForm();

    // User Form
    const { register: registerUser, handleSubmit: handleUser, reset: resetUser } = useForm();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const s = await api.getSalon();
        setSalon(s);
        // Populate form
        if (s) {
            Object.keys(s).forEach(key => setSalonValue(key, s[key]));
        }

        const u = await api.getUsers();
        setUsers(u);
    };

    const onSaveSalon = async (data: any) => {
        setLoading(true);
        try {
            await api.updateSalon(data);
            alert('Configurações salvas com sucesso!');
            loadData();
        } catch (e) {
            alert('Erro ao salvar');
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setSalonValue('logo', base64String);
                setSalon(prev => ({ ...prev, logo: base64String })); // Preview
            };
            reader.readAsDataURL(file);
        }
    };

    const onAddUser = async (data: any) => {
        try {
            await api.addUser(data);
            resetUser();
            loadData();
        } catch (e: any) {
            alert(e.error || 'Erro ao criar usuário');
        }
    };

    const onDeleteUser = async (id: number) => {
        if (confirm('Tem certeza?')) {
            await api.deleteUser(id);
            loadData();
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <header className="bg-white border-b border-gray-200 px-8 py-5 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-800">Configurações</h1>
                <p className="text-sm text-gray-500">Gerencie os dados do seu salão</p>

                <div className="flex gap-4 mt-6 overflow-x-auto pb-2 scrollbar-none">
                    <TabButton active={activeTab === 'salon'} onClick={() => setActiveTab('salon')} icon={<Building size={18} />}>Dados do Salão</TabButton>
                    <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<UsersIcon size={18} />}>Gestão de Usuários</TabButton>
                    <TabButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon={<FileText size={18} />}>Documentos & PDFs</TabButton>
                    <TabButton active={activeTab === 'plans'} onClick={() => setActiveTab('plans')} icon={<CreditCard size={18} />}>Assinatura & Planos</TabButton>
                </div>
            </header>

            <div className="p-8 flex-1 overflow-auto">
                <div className="max-w-4xl">
                    {/* SALON SETTINGS TAB */}
                    {activeTab === 'salon' && (
                        <form onSubmit={handleSalon(onSaveSalon)} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
                            <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Informações Gerais</h2>
                            <div className="grid grid-cols-2 gap-6">
                                <Input label="Nome do Salão" {...registerSalon('name')} />
                                <Input label="Telefone / Contato" {...registerSalon('phone')} />
                            </div>
                            <Input label="Email de Contato" {...registerSalon('email')} />
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Endereço Completo</label>
                                <textarea {...registerSalon('address')} className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-purple-400 min-h-[80px]" />
                            </div>

                            <div className="flex items-center gap-6 pt-6 border-t border-gray-100">
                                <div className="w-20 h-20 bg-gray-50 rounded-lg border border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                                    {salon.logo ? <img src={salon.logo} className="w-full h-full object-contain" /> : <span className="text-[10px] text-gray-400">Sem Logo</span>}
                                </div>
                                <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                                    <Upload size={16} /> Enviar Logo
                                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                                </label>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={loading}>
                                    <Save size={18} /> Salvar Alterações
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* USERS TAB */}
                    {activeTab === 'users' && (
                        <div className="space-y-8">
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                                        <tr>
                                            <th className="px-6 py-3">Nome</th>
                                            <th className="px-6 py-3 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {users.map(u => (
                                            <tr key={u.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-3 font-medium text-gray-800">{u.name} ({u.role})</td>
                                                <td className="px-6 py-3 text-right">
                                                    <button onClick={() => onDeleteUser(u.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">Adicionar Novo Usuário</h3>
                                <form onSubmit={handleUser(onAddUser)} className="grid grid-cols-2 gap-4">
                                    <Input label="Nome" {...registerUser('name')} />
                                    <Input label="Email" type="email" {...registerUser('email')} />
                                    <Input label="Senha" type="password" {...registerUser('password')} />
                                    <select {...registerUser('role')} className="w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:ring-2 focus:ring-purple-400 mt-6">
                                        <option value="professional">Profissional</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                    <div className="col-span-2 flex justify-end pt-2">
                                        <Button type="submit">Criar Usuário</Button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* REPORTS TAB */}
                    {activeTab === 'reports' && (
                        <div className="space-y-6">
                            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-8 rounded-[2rem] text-white shadow-xl">
                                <h3 className="text-2xl font-black mb-2 flex items-center gap-2">
                                    <FileText size={28} /> Central de Documentos & PDFs
                                </h3>
                                <p className="text-purple-100 mb-8 max-w-xl">Aceda aos seus relatórios profissionais de acordo com o seu plano.</p>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <ReportInfoCard
                                        title="Fluxo de Caixa Diário"
                                        desc="Relatório completo de entradas e saídas do dia."
                                        location="Menu: Financeiro"
                                    />
                                    <ReportInfoCard
                                        title="Resumo de Performance"
                                        desc="BI avançado e métricas de crescimento operacional."
                                        location="Menu: Dashboard"
                                    />
                                    <ReportInfoCard
                                        title="Inventário de Stock"
                                        desc="Lista de produtos e necessidades de reposição."
                                        location="Menu: Estoque"
                                    />
                                    <ReportInfoCard
                                        title="Folha de Comissões"
                                        desc="Pagamentos e cálculos automáticos de profissionais."
                                        location="Menu: Financeiro"
                                    />
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-gray-200 text-center">
                                <p className="text-gray-500 text-sm">Os botões de exportação (PDF) aparecem no topo de cada página indicada acima.</p>
                            </div>
                        </div>
                    )}

                    {/* PLANS TAB */}
                    {activeTab === 'plans' && (
                        <div className="space-y-10">
                            <div className="bg-gray-900 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
                                <div className="relative">
                                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">Status da Assinatura</p>
                                    <h3 className="text-3xl font-black mb-2 flex items-center gap-3">
                                        {license.type?.replace('_', ' ') || 'Teste Grátis'}
                                        <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full">ATIVO</span>
                                    </h3>
                                    <p className="text-gray-400 text-sm">Válido até: {DateTime.fromISO(license.validUntil).toFormat('dd/MM/yyyy')}</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6 pb-20">
                                <PlanCard
                                    name="Standard"
                                    price="1.800"
                                    annual="19.000"
                                    type="standard_month"
                                    salonId={salon.id || currentUser.salonId || currentUser.salon?.id}
                                    onSuccess={loadData}
                                    features={["Até 50 agendamentos", "Gestão de Membros", "Serviços", "Relatórios (PDF)"]}
                                    color="text-gray-600"
                                    btnClass="bg-gray-100 text-gray-800"
                                    active={license.type?.includes('standard')}
                                />
                                <PlanCard
                                    name="Gold"
                                    price="2.500"
                                    annual="22.000"
                                    type="gold_month"
                                    salonId={salon.id || currentUser.salonId || currentUser.salon?.id}
                                    onSuccess={loadData}
                                    features={["Até 70 agendamentos", "Stock Completo", "Vendas (PDF)", "Prioridade"]}
                                    color="text-purple-600"
                                    highlight
                                    btnClass="bg-purple-600 text-white"
                                    active={license.type?.includes('gold')}
                                />
                                <PlanCard
                                    name="Premium"
                                    price="3.000"
                                    annual="28.000"
                                    type="premium_month"
                                    salonId={salon.id || currentUser.salonId || currentUser.salon?.id}
                                    onSuccess={loadData}
                                    features={["Ilimitado", "BI & Performance", "No Ads", "Multi-Usuário"]}
                                    color="text-indigo-600"
                                    btnClass="bg-indigo-600 text-white"
                                    active={license.type?.includes('premium')}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <PayPalScript />
        </div>
    );
}

function ReportInfoCard({ title, desc, location }: any) {
    return (
        <div className="bg-white/10 p-4 rounded-xl border border-white/10">
            <h4 className="text-white font-bold text-sm mb-1">{title}</h4>
            <p className="text-[10px] text-purple-100 mb-2">{desc}</p>
            <p className="text-[9px] font-black uppercase text-purple-200 mt-2 pt-2 border-t border-white/5">{location}</p>
        </div>
    );
}

function PayPalScript() {
    const user = JSON.parse(localStorage.getItem('salao_user') || '{}');
    if (user.role?.startsWith('super_') || document.getElementById('paypal-sdk-script')) return null;

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=Ae5ECHexqZZdwVoXY_RqhqEi00m-39EJk0RTvWH7gpXQ3rF3ZvOSKaocFWSjm9CI48FJFZauOMcZHfYD&currency=USD`;
    script.id = 'paypal-sdk-script';
    script.async = true;
    document.body.appendChild(script);
    return null;
}

function PlanCard({ name, price, annual, features, color, highlight, btnClass, active, salonId, type, onSuccess }: any) {
    const [checkingOut, setCheckingOut] = useState(false);

    const handlePayPal = async (cycle: 'month' | 'year') => {
        if (!salonId) return alert('Identificação do salão não encontrada. Recarregue a página.');
        if (!(window as any).paypal) return alert('O PayPal está a carregar... Tente em instantes.');

        const finalPrice = cycle === 'month' ? price.replace('.', '') : annual.replace('.', '');
        setCheckingOut(true);

        try {
            (window as any).paypal.Buttons({
                createOrder: (data: any, actions: any) => {
                    const usdPrice = (parseFloat(finalPrice) / 64).toFixed(2);
                    return actions.order.create({
                        purchase_units: [{
                            amount: { value: usdPrice, currency_code: 'USD' },
                            description: `Assinatura Xonguile: ${name} (${cycle})`
                        }],
                        application_context: {
                            shipping_preference: 'NO_SHIPPING'
                        }
                    });
                },
                onApprove: async (data: any, actions: any) => {
                    await actions.order.capture();
                    await api.activateSubscription(salonId, type.replace('month', cycle));
                    alert('Assinatura ativada com sucesso!');
                    onSuccess();
                },
                onError: (err: any) => {
                    console.error(err);
                    alert('Erro no processamento do PayPal.');
                }
            }).render('#paypal-button-container-' + name);
        } catch (e) {
            console.error(e);
        } finally {
            setCheckingOut(false);
        }
    };

    return (
        <div className={clsx(
            "p-6 rounded-[2rem] bg-white border flex flex-col justify-between transition-all",
            highlight ? "border-purple-600 shadow-xl scale-105" : "border-gray-100",
            active && "opacity-60 border-emerald-500"
        )}>
            <div>
                <h4 className={clsx("text-xl font-black mb-4", color)}>{name}</h4>
                <p className="text-3xl font-black text-gray-900 mb-6">MZN {price}<span className="text-xs text-gray-400 font-medium">/mês</span></p>
                <ul className="space-y-3 mb-8">
                    {features.map((f: string, i: number) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                            <CheckCircle size={14} className="text-emerald-500" /> {f}
                        </li>
                    ))}
                </ul>
            </div>
            {!active && (
                <div className="space-y-3">
                    <button onClick={() => handlePayPal('month')} className={clsx("w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2", btnClass)}>
                        {checkingOut ? <Loader2 className="animate-spin" size={18} /> : 'Assinar Agora'}
                    </button>
                    <div id={`paypal-button-container-${name}`} className="min-h-[40px]"></div>
                </div>
            )}
            {active && (
                <div className="w-full py-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-bold flex items-center justify-center gap-2">
                    <CheckCircle size={18} /> Plano Ativo
                </div>
            )}
        </div>
    );
}

function TabButton({ active, onClick, icon, children }: any) {
    return (
        <button onClick={onClick} className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
            active ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" : "bg-white text-gray-500 hover:bg-gray-100"
        )}>
            {icon} {children}
        </button>
    );
}
