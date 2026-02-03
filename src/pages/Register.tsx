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
                            placeholder="contato@salao.com"
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
                            <Button className="w-full py-3 text-lg font-bold shadow-purple-600/20" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" /> : 'Começar Teste Grátis'}
                            </Button>
                        </div>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <p className="text-gray-500">Já tem uma conta?</p>
                        <Link to="/login" className="text-purple-600 font-bold hover:underline">Fazer Login</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
