import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
    Save, Building, Receipt, Users, Trash2, Plus, Upload,
    Sparkles, CheckCircle, Loader2, Shield, Lock, CreditCard
} from 'lucide-react';
import { clsx } from 'clsx';
import { useForm } from 'react-hook-form';
import { DateTime } from 'luxon';
import { Link } from 'react-router-dom';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'salon' | 'receipt' | 'users' | 'plans'>('salon');
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [salon, setSalon] = useState<any>({});
    const currentUser = JSON.parse(localStorage.getItem('salao_user') || '{}');
    const license = salon?.License || salon?.license || {};

    useEffect(() => {
        if (license.status && license.status !== 'active' && activeTab !== 'plans') {
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

                <div className="flex gap-4 mt-6">
                    <TabButton active={activeTab === 'salon'} onClick={() => setActiveTab('salon')} icon={<Building size={18} />}>Dados do Salão</TabButton>
                    <TabButton active={activeTab === 'receipt'} onClick={() => setActiveTab('receipt')} icon={<Receipt size={18} />}>Configurar Recibo</TabButton>
                    <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={18} />}>Gestão de Usuários</TabButton>
                    <TabButton active={activeTab === 'plans'} onClick={() => setActiveTab('plans')} icon={<Sparkles size={18} />}>Plano e Assinatura</TabButton>
                </div>
            </header>

            <div className="p-8 flex-1 overflow-auto max-w-4xl">

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

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={loading}>
                                <Save size={18} /> Salvar Alterações
                            </Button>
                        </div>
                    </form>
                )}

                {/* RECEIPT CONFIG TAB */}
                {activeTab === 'receipt' && (
                    <form onSubmit={handleSalon(onSaveSalon)} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
                        <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Personalização de Recibos</h2>

                        <div className="flex gap-8 items-start">
                            <div className="flex-1 space-y-4">
                                <Input label="NUIT / NIF" placeholder="Ex: 123456789" {...registerSalon('nuit')} />
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Rodapé do Recibo</label>
                                    <textarea
                                        {...registerSalon('receiptFooter')}
                                        placeholder="Ex: Obrigado pela preferência! Volte sempre."
                                        className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-purple-400 min-h-[80px]"
                                    />
                                </div>
                            </div>

                            <div className="w-64 flex flex-col items-center gap-4 p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50">
                                <div className="w-32 h-32 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden relative">
                                    {salon.logo ? (
                                        <img src={salon.logo} alt="Logo" className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="text-gray-400 text-xs text-center p-2">Sem Logo</span>
                                    )}
                                </div>
                                <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                                    <Upload size={16} /> Carregar Logo
                                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                                </label>
                                <p className="text-[10px] text-gray-400 text-center">Recomendado: 200x200px PNG com fundo transparente</p>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={loading}>
                                <Save size={18} /> Salvar Configurações
                            </Button>
                        </div>
                    </form>
                )}

                {/* USERS TAB */}
                {activeTab === 'users' && (
                    <div className="space-y-8">
                        {/* List */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                                    <tr>
                                        <th className="px-6 py-3">Nome</th>
                                        <th className="px-6 py-3">Email</th>
                                        <th className="px-6 py-3">Função</th>
                                        <th className="px-6 py-3 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {users.map(u => (
                                        <tr key={u.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-3 font-medium text-gray-800">{u.name}</td>
                                            <td className="px-6 py-3 text-gray-600">{u.email}</td>
                                            <td className="px-6 py-3">
                                                <span className={clsx(
                                                    "px-2 py-1 rounded text-xs font-semibold capitalize",
                                                    u.role === 'admin' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                                                )}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <button onClick={() => onDeleteUser(u.id)} className="text-gray-400 hover:text-red-600">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Add New */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Plus size={18} /> Adicionar Novo Usuário
                            </h3>
                            <form onSubmit={handleUser(onAddUser)} className="grid grid-cols-2 gap-4 items-end">
                                <Input label="Nome" placeholder="Nome do usuário" {...registerUser('name', { required: true })} />
                                <Input label="Email" type="email" placeholder="email@salao.com" {...registerUser('email', { required: true })} />
                                <Input label="Senha" type="password" placeholder="••••••" {...registerUser('password', { required: true })} />
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">Função</label>
                                    <select {...registerUser('role')} className="w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-purple-400">
                                        <option value="professional">Profissional (Acesso Limitado)</option>
                                        <option value="reception">Recepção</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                                <div className="col-span-2 flex justify-end">
                                    <Button type="submit">Criar Usuário</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* PLANS & SUBSCRIPTION TAB */}
                {activeTab === 'plans' && (
                    <div className="space-y-10 animate-in fade-in duration-500">
                        {/* Current Plan Header */}
                        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                            <div className="relative">
                                <p className="text-purple-100 text-sm font-bold uppercase tracking-widest mb-2">Seu Plano Atual</p>
                                <h3 className="text-4xl font-black mb-4 capitalize">
                                    {license.type?.replace('_', ' ') || 'Teste Grátis'}
                                </h3>
                                <div className="flex items-center gap-2 text-purple-100 text-sm">
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                                    Status: <span className="font-bold text-white uppercase">{license.status}</span>
                                    <span className="mx-2">•</span>
                                    Expira em: <span className="font-bold text-white">{DateTime.fromISO(license.validUntil).toFormat('dd/MM/yyyy')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Plan Comparison */}
                        <div>
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-black text-gray-900 mb-2">Escolha o plano ideal</h2>
                                <p className="text-gray-500">Escala as funcionalidades de acordo com o crescimento do seu salão</p>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6">
                                <PlanCard
                                    name="Standard"
                                    price="1.800"
                                    annual="19.000"
                                    type="standard_month"
                                    salonId={salon.id}
                                    onSuccess={loadData}
                                    features={[
                                        "Até 50 agendamentos mensais",
                                        "Gestão de Profissionais",
                                        "Controle de Serviços",
                                        "Relatórios Básicos",
                                    ]}
                                    color="text-gray-600"
                                    btnClass="bg-gray-100 text-gray-800 hover:bg-gray-200"
                                    active={license.type?.includes('standard')}
                                />
                                <PlanCard
                                    name="Gold"
                                    price="2.500"
                                    annual="22.000"
                                    type="gold_month"
                                    salonId={salon.id}
                                    onSuccess={loadData}
                                    features={[
                                        "Até 70 agendamentos mensais",
                                        "Gestão de Estoque Completa",
                                        "Relatórios de Vendas e Serviços",
                                        "Suporte Prioritário",
                                    ]}
                                    color="text-purple-600 border-purple-200"
                                    highlight
                                    btnClass="bg-purple-600 text-white hover:bg-purple-700"
                                    active={license.type?.includes('gold')}
                                />
                                <PlanCard
                                    name="Premium"
                                    price="3.000"
                                    annual="28.000"
                                    type="premium_month"
                                    salonId={salon.id}
                                    onSuccess={loadData}
                                    features={[
                                        "Agendamentos Ilimitados",
                                        "Fila de Espera Digital",
                                        "Relatórios Avançados e BI",
                                        "Sem anúncios Xonguile",
                                    ]}
                                    color="text-indigo-600 border-indigo-200"
                                    btnClass="bg-indigo-600 text-white hover:bg-indigo-700"
                                    active={license.type?.includes('premium')}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* PAYPAL SDK SCRIPT */}
            <PayPalScript />
        </div>
    );
}

function PayPalScript() {
    const user = JSON.parse(localStorage.getItem('salao_user') || '{}');
    const isMaster = user.role?.startsWith('super_');

    // Não carrega o script se for Super Admin ou se já existir
    if (isMaster || document.getElementById('paypal-sdk-script')) return null;

    const script = document.createElement('script');
    // USANDO O TEU CLIENT ID RESTRITO PARA O FRONTEND
    script.src = `https://www.paypal.com/sdk/js?client-id=Ae5ECHexqZZdwVoXY_RqhqEi00m-39EJk0RTvWH7gpXQ3rF3ZvOSKaocFWSjm9CI48FJFZauOMcZHfYD&currency=MZN`;
    script.id = 'paypal-sdk-script';
    script.async = true;
    document.body.appendChild(script);

    return null;
}

function PlanCard({ name, price, annual, features, color, highlight, btnClass, active, salonId, type, onSuccess }: any) {
    const [checkingOut, setCheckingOut] = useState(false);

    const handlePayPal = async (billingCycle: 'month' | 'year') => {
        if (!salonId) return alert('Carregando informações do salão...');
        if (!(window as any).paypal) return alert('O PayPal ainda está a carregar... Tente em 2 segundos.');

        const finalType = type.replace('month', billingCycle);
        const finalPrice = billingCycle === 'month' ? price.replace('.', '') : annual.replace('.', '');

        setCheckingOut(true);

        try {
            // RENDERIZA O BOTÃO OFICIAL PAYPAL
            (window as any).paypal.Buttons({
                createOrder: (data: any, actions: any) => {
                    return actions.order.create({
                        purchase_units: [{
                            amount: { value: finalPrice, currency_code: 'MZN' },
                            description: `Plano Xonguile ${name} - ${billingCycle}`
                        }]
                    });
                },
                onApprove: async (data: any, actions: any) => {
                    const details = await actions.order.capture();
                    // Ativa no nosso backend após sucesso real no PayPal
                    await api.activateSubscription(salonId, finalType);
                    alert(`✅ PAGAMENTO CONFIRMADO! Bem-vindo ao plano ${name}.`);
                    onSuccess();
                },
                onError: (err: any) => {
                    console.error("PayPal Error:", err);
                    alert("Ocorreu um erro no portal do PayPal.");
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
            "p-8 rounded-[2.5rem] bg-white border-2 flex flex-col justify-between transition-all hover:shadow-2xl",
            highlight ? "border-purple-600 scale-105 shadow-xl z-10" : "border-gray-100",
            active && "opacity-60 border-emerald-500"
        )}>
            <div>
                {highlight && <div className="bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full w-fit mb-4 mx-auto">Mais Popular</div>}
                <h4 className={clsx("text-2xl font-black mb-4 text-center", color)}>{name}</h4>
                <div className="text-center mb-8">
                    <p className="text-4xl font-black text-gray-900 tracking-tight">
                        <span className="text-lg font-bold">MZN</span> {price}
                    </p>
                    <p className="text-gray-400 font-medium text-sm">por mês</p>
                    <p className="text-[10px] text-gray-400 mt-1">ou MZN {annual} anual</p>
                </div>
                <ul className="space-y-4 mb-8">
                    {features.map((f: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                            <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                            {f}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="space-y-4">
                {!active && (
                    <div className="space-y-3">
                        <button
                            className={clsx("w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2", btnClass, checkingOut && "cursor-default opacity-80")}
                            disabled={checkingOut}
                            onClick={() => handlePayPal('month')}
                        >
                            {checkingOut ? <Loader2 className="animate-spin" /> : 'Pagar via PayPal (Mensal)'}
                        </button>

                        <div id={`paypal-button-container-${name}`} className="mt-2 min-h-[40px] z-50"></div>
                    </div>
                )}
                {active && (
                    <div className="w-full py-4 rounded-2xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center gap-2 border border-emerald-100">
                        <CheckCircle size={20} /> Plano Atual Ativo
                    </div>
                )}
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon, children }: { active: boolean, onClick: () => void, icon: React.ReactNode, children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                active ? "bg-purple-600 text-white shadow-md shadow-purple-600/20" : "bg-white text-gray-600 hover:bg-gray-100 border border-transparent"
            )}
        >
            {icon}
            {children}
        </button>
    )
}
