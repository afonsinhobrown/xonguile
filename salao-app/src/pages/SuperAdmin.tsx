import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Shield, CheckCircle, XCircle, Search, Power } from 'lucide-react';
import { clsx } from 'clsx';
import { useForm } from 'react-hook-form';

export default function SuperAdminPage() {
    const [salons, setSalons] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await api.getAllSalons();
        setSalons(data);
    };

    const handleStatusToggle = async (salonId: number, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        if (confirm(`Tem certeza que deseja mudar para ${newStatus}?`)) {
            setLoading(true);
            await api.updateSalonStatus(salonId, newStatus);
            loadData();
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <header className="bg-white border-b border-gray-200 px-8 py-5 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Shield className="text-purple-600" /> Painel do Super Admin
                </h1>
                <p className="text-sm text-gray-500">Gestão global de salões e licenças</p>
            </header>

            <div className="p-8 flex-1 overflow-auto">

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

                    {/* Toolbar */}
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 w-64">
                            <Search size={14} />
                            <input placeholder="Buscar salão..." className="bg-transparent outline-none w-full" />
                        </div>
                        <div className="text-sm text-gray-500">
                            Total Salões: <b>{salons.length}</b>
                        </div>
                    </div>

                    {/* Table */}
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Salão</th>
                                <th className="px-6 py-3">Responsável</th>
                                <th className="px-6 py-3">Licença</th>
                                <th className="px-6 py-3">Validade</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {salons.map(s => (
                                <tr key={s.id} className="hover:bg-gray-50 group transition-colors">
                                    <td className="px-6 py-3">
                                        <div className="font-bold text-gray-800">{s.name}</div>
                                        <div className="text-xs text-gray-400">{s.email}</div>
                                    </td>
                                    <td className="px-6 py-3 text-gray-600">
                                        {s.Users?.[0]?.name || '---'}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={clsx(
                                            "px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide",
                                            s.License?.type === 'trial' ? "bg-orange-100 text-orange-700" :
                                                s.License?.type === 'lifetime' ? "bg-purple-100 text-purple-700" :
                                                    "bg-blue-100 text-blue-700"
                                        )}>
                                            {s.License?.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-gray-600">
                                        {s.License?.validUntil ? new Date(s.License.validUntil).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-6 py-3">
                                        {s.License?.status === 'active' ? (
                                            <span className="flex items-center gap-1 text-green-600 font-medium">
                                                <CheckCircle size={14} /> Ativo
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-red-500 font-medium">
                                                <XCircle size={14} /> {s.License?.status === 'suspended' ? 'Suspenso' : 'Expirado'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <button
                                            onClick={() => handleStatusToggle(s.id, s.License?.status || 'expired')}
                                            disabled={loading}
                                            title={s.License?.status === 'active' ? "Desativar" : "Ativar"}
                                            className={clsx(
                                                "p-2 rounded-lg transition-colors",
                                                s.License?.status === 'active'
                                                    ? "text-gray-400 hover:bg-red-50 hover:text-red-600"
                                                    : "text-gray-400 hover:bg-green-50 hover:text-green-600"
                                            )}
                                        >
                                            <Power size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
