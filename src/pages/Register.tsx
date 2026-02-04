import { useState } from 'react';
import { api } from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';
import { Scissors, Lock, Mail, Loader2, Store, Phone, User as UserIcon } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function RegisterPage() {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Simple form state
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
            await api.registerSalon(formData);

            alert('Conta criada com sucesso! Faça login para começar seu Teste Grátis de 10 dias.');
            navigate('/login');
        } catch (error: any) {
            alert(error.error || 'Falha no cadastro');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col md:flex-row">

                {/* Left Side (Banner) - Hidden on mobile, visible on desktop could be nice but let's keep simple vertical for now */}

                <div className="w-full p-8">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">Crie sua Conta Grátis</h1>
                        <p className="text-gray-500 text-sm mt-1">Teste o Xonguile App Premium por 10 dias</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Nome do Salão"
                                name="salonName"
                                placeholder="Ex: Salão Beleza Pura"
                                required
                                value={formData.salonName}
                                onChange={handleChange}
                            // icon={<Store size={16} />}
                            />
                            <Input
                                label="Telefone do Salão"
                                name="phone"
                                placeholder="84 123 4567"
                                required
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>

                        <Input
                            label="Seu Nome (Admin)"
                            name="adminName"
                            placeholder="Nome do Dono/Gerente"
                            required
                            value={formData.adminName}
                            onChange={handleChange}
                        />

                        <Input
                            label="Email Profissional"
                            name="adminEmail"
                            type="email"
                            placeholder="teu@email.com"
                            required
                            value={formData.adminEmail}
                            onChange={handleChange}
                        />

                        <Input
                            label="Senha de Acesso"
                            name="adminPassword"
                            type="password"
                            placeholder="Crie uma senha forte"
                            required
                            value={formData.adminPassword}
                            onChange={handleChange}
                        />

                        <div className="pt-2">
                            <Button className="w-full py-4 text-lg font-bold shadow-purple-600/20" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" /> : 'Criar Conta e Começar Teste Grátis'}
                            </Button>
                        </div>
                    </form>

                    <div className="mt-8 border-t border-gray-100 pt-6">
                        <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Planos após o teste grátis</p>
                        <div className="grid grid-cols-3 gap-2">
                            <PlanSmall name="Standard" price="1.800" />
                            <PlanSmall name="Gold" price="2.500" highlight />
                            <PlanSmall name="Premium" price="3.000" />
                        </div>
                    </div>

                    <div className="mt-6 text-center text-sm">
                        <p className="text-gray-500">Já tem uma conta?</p>
                        <Link to="/login" className="text-purple-600 font-bold hover:underline">Fazer Login</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PlanSmall({ name, price, highlight }: any) {
    return (
        <div className={clsx(
            "p-3 rounded-xl border text-center transition-all",
            highlight ? "border-purple-200 bg-purple-50" : "border-gray-100"
        )}>
            <p className="text-[10px] font-bold text-gray-400 uppercase">{name}</p>
            <p className={clsx("text-sm font-black", highlight ? "text-purple-600" : "text-gray-800")}>{price}</p>
            <p className="text-[8px] text-gray-400 italic">MT/mês</p>
        </div>
    );
}
