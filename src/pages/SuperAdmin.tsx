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
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'salons' | 'supers'>('salons');
    const user = JSON.parse(localStorage.getItem('salao_user') || '{}');

    const loadSalons = async () => {
        setLoading(true);
        try {
            const data = await api.getSuperSalons();
            setSalons(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSalons();
    }, []);

    const handleUpdateLicense = async (salonId: number, data: any) => {
        if (!confirm('Deseja atualizar esta licença?')) return;
        try {
            await api.updateSuperLicense(salonId, data);
            alert('Sucesso!');
            loadSalons();
        } catch (e) {
            alert('Falha ao atualizar');
        }
    };

    return (
        <div className="p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Painel Administrativo</h1>
                    <p className="text-gray-500">Gestão global do ecossistema Xonguile App</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('salons')}
                        className={clsx("px-4 py-2 rounded-lg text-sm font-bold transition-all", activeTab === 'salons' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500')}
                    >
                        Salões
                    </button>
                    {user.role === 'super_level_1' && (
                        <button
                            onClick={() => setActiveTab('supers')}
                            className={clsx("px-4 py-2 rounded-lg text-sm font-bold transition-all", activeTab === 'supers' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500')}
                        >
                            Equipa Super
                        </button>
                    )}
                </div>
            </header>

            {activeTab === 'salons' ? (
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Salão</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Administrador</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Plano Atual</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Estado</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {salons.map(s => {
                                    const admin = s.Users?.find((u: any) => u.role === 'admin');
                                    return (
                                        <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold">
                                                        {s.name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800">{s.name}</p>
                                                        <p className="text-xs text-gray-400">slug: {s.slug}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-medium text-gray-700">{admin?.name || 'Sem admin'}</p>
                                                <p className="text-xs text-gray-400">{admin?.email || '-'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={clsx(
                                                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                                                    s.License?.type === 'trial' ? 'bg-amber-100 text-amber-700' :
                                                        s.License?.type?.includes('premium') ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                                )}>
                                                    {s.License?.type.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {s.License?.status === 'active' ? (
                                                    <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                                                        <CheckCircle size={14} /> Ativo
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-red-600 text-xs font-bold">
                                                        <XCircle size={14} /> Inativo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <select
                                                    onChange={(e) => handleUpdateLicense(s.id, { type: e.target.value, status: 'active', validUntil: DateTime.now().plus({ months: 1 }).toJSDate() })}
                                                    defaultValue=""
                                                    className="text-xs border-gray-200 rounded-lg"
                                                >
                                                    <option value="" disabled>Mudar Plano</option>
                                                    <option value="standard_month">Standard (Mes)</option>
                                                    <option value="gold_month">Gold (Mes)</option>
                                                    <option value="premium_month">Premium (Mes)</option>
                                                </select>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="max-w-md bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <UserPlus className="text-purple-600" />
                        Criar Assistente Super (Nível 2)
                    </h3>
                    <form className="space-y-4" onSubmit={async (e: any) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        await api.createSuperAssistant(Object.fromEntries(formData));
                        alert('Assistente criado!');
                        e.target.reset();
                    }}>
                        <Input label="Nome" name="name" required />
                        <Input label="Email" name="email" required />
                        <Input label="Senha" name="password" type="password" required />
                        <Button className="w-full py-4">Criar Conta Super</Button>
                    </form>
                </div>
            )}
        </div>
    );
}
