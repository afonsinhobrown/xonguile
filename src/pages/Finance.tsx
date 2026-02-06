import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Plus, TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart, FileText, Sparkles, Lock, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { clsx } from 'clsx';
import { DateTime } from 'luxon';
import { Link } from 'react-router-dom';

const transactionSchema = z.object({
    description: z.string().min(2, 'Descrição obrigatória'),
    amount: z.number().min(0.01, 'Valor inválido'),
    type: z.enum(['income', 'expense']),
    category: z.string().min(2, 'Categoria obrigatória'),
    paymentMethod: z.string().min(2, 'Forma de pagamento obrigatória'),
});

type TransactionFormType = z.infer<typeof transactionSchema>;

export default function FinancePage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('salao_user') || '{}');
    const license = user?.salon?.License || {};
    const reportLevel = license.reportLevel || 1; // 1: Basic, 2: Extended, 3: Full

    const loadData = async () => {
        setLoading(true);
        const data = await api.getTransactions();
        setTransactions(data);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<TransactionFormType>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            type: 'expense',
            category: 'Despesa Operacional',
            paymentMethod: 'Dinheiro'
        }
    });

    const transactionType = watch('type');

    const onSubmit = async (data: TransactionFormType) => {
        try {
            await api.addTransaction({
                ...data,
                date: new Date()
            });
            setIsModalOpen(false);
            reset();
            loadData();
        } catch (error) {
            alert('Erro ao salvar movimentação');
        }
    };

    // Metrics
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const balance = totalIncome - totalExpense;

    const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'MZN' }).format(val);

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Financeiro</h1>
                    <p className="text-sm text-gray-500">Controle de entradas e saídas do caixa</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => { setValue('type', 'expense'); setIsModalOpen(true); }} className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 shadow-none border border-red-200">
                        <TrendingDown size={18} />
                        Lançar Despesa
                    </Button>
                    <Button onClick={() => { setValue('type', 'income'); setIsModalOpen(true); }} className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 shadow-none border border-emerald-200">
                        <TrendingUp size={18} />
                        Lançar Receita
                    </Button>
                </div>
            </header>

            {/* Summary Cards */}
            <div className="px-8 mt-6">
                <div className="grid grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Total Entradas</p>
                        <p className="text-2xl font-bold text-emerald-600">+{formatMoney(totalIncome)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Total Saídas</p>
                        <p className="text-2xl font-bold text-red-600">-{formatMoney(totalExpense)}</p>
                    </div>
                    <div className={clsx("p-6 rounded-xl border shadow-sm", balance >= 0 ? "bg-blue-50 border-blue-100" : "bg-red-50 border-red-100")}>
                        <p className={clsx("text-sm mb-1 font-medium", balance >= 0 ? "text-blue-600" : "text-red-600")}>Saldo Atual</p>
                        <div className="flex items-center gap-2">
                            <DollarSign size={24} className={balance >= 0 ? "text-blue-600" : "text-red-600"} />
                            <p className={clsx("text-2xl font-bold", balance >= 0 ? "text-blue-800" : "text-red-800")}>{formatMoney(balance)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reports Section */}
            <div className="px-8 mt-8">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 uppercase tracking-widest text-[10px]">
                    <BarChart3 size={14} className="text-purple-600" />
                    Central de Relatórios
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
                    <ReportButton
                        label="Fluxo Diário"
                        icon={<FileText size={18} />}
                        active={true}
                        onClick={() => window.print()}
                    />
                    <ReportButton
                        label="Vendas por Serviço"
                        icon={<PieChart size={18} />}
                        active={reportLevel >= 2}
                        isPremium={reportLevel < 2}
                        onClick={() => window.print()}
                    />
                    <ReportButton
                        label="Comissões"
                        icon={<Users size={18} />}
                        active={reportLevel >= 2}
                        isPremium={reportLevel < 2}
                    />
                    <ReportButton
                        label="BI Avançado"
                        icon={<Sparkles size={18} />}
                        active={reportLevel >= 3}
                        isPremium={reportLevel < 3}
                    />
                </div>
            </div>

            <div className="p-8 flex-1 overflow-auto">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium">
                            <tr>
                                <th className="px-6 py-4">Data</th>
                                <th className="px-6 py-4">Descrição</th>
                                <th className="px-6 py-4">Categoria</th>
                                <th className="px-6 py-4">Pagamento</th>
                                <th className="px-6 py-4 text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {transactions.map(t => (
                                <tr key={t.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4 text-gray-500">
                                        {DateTime.fromISO(t.date || t.createdAt).toFormat('dd/MM HH:mm')}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-800">
                                        {t.description}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs px-2 py-1 rounded text-xs">{t.category}</span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 capitalize">{t.paymentMethod}</td>
                                    <td className={clsx("px-6 py-4 text-right font-bold", t.type === 'income' ? 'text-emerald-600' : 'text-red-600')}>
                                        {t.type === 'income' ? '+' : '-'} {formatMoney(t.amount)}
                                    </td>
                                </tr>
                            ))}
                            {transactions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                        <p>Nenhuma movimentação registrada.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={transactionType === 'income' ? 'Nova Receita' : 'Nova Despesa'}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="Descrição"
                        placeholder={transactionType === 'income' ? 'Ex: Venda de Shampoo' : 'Ex: Conta de Luz'}
                        {...register('description')}
                        error={errors.description?.message}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Valor (MT)"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...register('amount', { valueAsNumber: true })}
                            error={errors.amount?.message}
                        />

                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Categoria</label>
                            <select {...register('category')} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 h-10">
                                {transactionType === 'income' ? (
                                    <>
                                        <option value="Serviços">Serviços</option>
                                        <option value="Produtos">Venda de Produtos</option>
                                        <option value="Outros">Outras Receitas</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="Operacional">Despesa Operacional (Luz, Água)</option>
                                        <option value="Fornecedores">Fornecedores/Estoque</option>
                                        <option value="Pessoal">Pagamento Pessoal</option>
                                        <option value="Manutenção">Manutenção</option>
                                        <option value="Marketing">Marketing</option>
                                        <option value="Retirada">Sangria/Retirada de Sócio</option>
                                    </>
                                )}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Forma de Pagamento</label>
                        <select {...register('paymentMethod')} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 h-10">
                            <option value="Dinheiro">Dinheiro</option>
                            <option value="Cartão">Cartão de Crédito/Débito</option>
                            <option value="M-Pesa">M-Pesa / E-Mola</option>
                            <option value="Transferência">Transferência Bancária</option>
                        </select>
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" className={transactionType === 'expense' ? 'bg-red-600 hover:bg-red-700' : ''}>
                            {transactionType === 'income' ? 'Registrar Entrada' : 'Registrar Saída'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

function ReportButton({ label, icon, active, isPremium, onClick }: { label: string, icon: React.ReactNode, active: boolean, isPremium?: boolean, onClick?: () => void }) {
    if (isPremium) {
        return (
            <Link to="/admin/configuracoes" className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-xl relative overflow-hidden group hover:bg-white hover:border-purple-200 transition-all">
                <div className="text-gray-400">{icon}</div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-400 group-hover:text-purple-600 transition-colors">{label}</span>
                    <span className="text-[10px] text-purple-600 font-black uppercase flex items-center gap-1">
                        <Lock size={10} /> Upgrade
                    </span>
                </div>
            </Link>
        );
    }

    return (
        <button
            onClick={onClick}
            className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md hover:border-purple-200 transition-all"
            disabled={!active}
        >
            <div className="text-purple-600">{icon}</div>
            <span className="text-sm font-bold text-gray-800">{label}</span>
        </button>
    );
}
