import { useState } from 'react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { Scissors, Lock, Mail, Loader2 } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const user = await api.login({ email, password });
            localStorage.setItem('salao_user', JSON.stringify(user));
            navigate('/admin'); // Go to Dashboard
        } catch (error: any) {
            alert(error.error || 'Falha no login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-8 text-center bg-purple-50 border-b border-purple-100">
                    <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-purple-600/30">
                        <Scissors size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Xonguile App</h1>
                    <p className="text-gray-500 text-sm mt-1">Gestão de Beleza por #EncubadoraDeSoluções</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Email Profissional</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    required
                                    autoComplete="email"
                                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                                    placeholder="admin@salao.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="password"
                                    required
                                    autoComplete="current-password"
                                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                                    placeholder="••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button className="w-full py-3 text-lg font-bold shadow-purple-600/20" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" /> : 'Entrar no Sistema'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-xs text-gray-400">
                        <p>Esqueceu a senha? Contate o suporte.</p>
                        <p className="mt-2">v2.0 SaaS Enterprise</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
