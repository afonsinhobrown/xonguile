import { useState } from 'react';
import { api } from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';
import { Scissors, Lock, Mail, Loader2, Store, Phone, User as UserIcon } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { clsx } from 'clsx';

export default function RegisterPage() {
    const [loading, setLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<'trial' | 'standard' | 'gold' | 'premium'>('trial');
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        salonName: '',
        phone: '',
        adminName: '',
        adminEmail: '',
        adminPassword: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.registerSalon({ ...formData, plan: selectedPlan });

            if (selectedPlan === 'trial') {
                alert('Conta criada com sucesso! Aproveite os 10 dias de teste.');
            } else {
                alert(`Conta criada! Agora, faça login e ative seu plano ${selectedPlan} em Configurações > Planos.`);
            }
            navigate('/login');
        } catch (error: any) {
            alert(error.error || 'Falha no cadastro');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row">

                {/* Info Panel */}
                <div className="hidden md:flex w-1/3 bg-purple-600 p-12 text-white flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md">
                            <Scissors size={24} />
                        </div>
                        <h2 className="text-3xl font-black leading-tight mb-4 tracking-tight">O futuro do seu salão começa aqui.</h2>
                        <p className="text-purple-100 opacity-80">Gestão simplificada, clientes mais felizes e lucros maiores.</p>
                    </div>
                    <div className="space-y-4">
                        <FeatureItem text="Agendamento Inteligente" />
                        <FeatureItem text="Faturação e PDV" />
                        <FeatureItem text="Relatórios Financeiros" />
                    </div>
                </div>

                {/* Form Panel */}
                <div className="flex-1 p-8 md:p-12">
                    <div className="mb-8">
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Crie sua Conta Master</h1>
                        <p className="text-gray-500 mt-1">Preencha os dados do seu negócio.</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Nome do Salão" name="salonName" placeholder="Ex: Studio VIP" required value={formData.salonName} onChange={handleChange} />
                            <Input label="Telefone" name="phone" placeholder="84 000 0000" required value={formData.phone} onChange={handleChange} />
                        </div>

                        <Input label="Seu Nome (Admin)" name="adminName" placeholder="Nome Completo" required value={formData.adminName} onChange={handleChange} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Email de Acesso" name="adminEmail" type="email" placeholder="admin@email.com" required value={formData.adminEmail} onChange={handleChange} />
                            <Input label="Senha" name="adminPassword" type="password" placeholder="••••••••" required value={formData.adminPassword} onChange={handleChange} />
                        </div>

                        {/* PLAN SELECTOR */}
                        <div className="pt-4 border-t border-gray-100">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-3">Escolha seu Plano Inicial</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                <PlanBtn active={selectedPlan === 'trial'} onClick={() => setSelectedPlan('trial')} name="Trial" sub="10 Dias" />
                                <PlanBtn active={selectedPlan === 'standard'} onClick={() => setSelectedPlan('standard')} name="Standard" sub="MZN 1.800" />
                                <PlanBtn active={selectedPlan === 'gold'} onClick={() => setSelectedPlan('gold')} name="Gold" sub="MZN 2.500" />
                                <PlanBtn active={selectedPlan === 'premium'} onClick={() => setSelectedPlan('premium')} name="Premium" sub="MZN 3.000" />
                            </div>
                        </div>

                        <div className="pt-6">
                            <Button className="w-full py-4 text-lg font-black shadow-lg shadow-purple-600/20" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" /> : 'Criar Conta e Começar'}
                            </Button>
                        </div>
                    </form>

                    <div className="mt-8 text-center text-sm">
                        <p className="text-gray-500">Já tem uma conta? <Link to="/login" className="text-purple-600 font-bold hover:underline">Fazer Login</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FeatureItem({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-purple-200" />
            <span className="font-bold text-sm">{text}</span>
        </div>
    );
}

function PlanBtn({ active, onClick, name, sub }: any) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={clsx(
                "p-3 rounded-2xl border-2 text-left transition-all",
                active ? "border-purple-600 bg-purple-50" : "border-gray-100 hover:border-gray-200"
            )}
        >
            <p className={clsx("text-xs font-black", active ? "text-purple-600" : "text-gray-800")}>{name}</p>
            <p className="text-[10px] text-gray-400 font-bold">{sub}</p>
        </button>
    );
}
