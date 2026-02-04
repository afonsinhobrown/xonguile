import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Plus, Package, AlertTriangle, Search, ArrowUp, ArrowDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { clsx } from 'clsx';

const productSchema = z.object({
    name: z.string().min(2, 'Nome muito curto'),
    price: z.number().min(0),
    cost: z.number().min(0),
    quantity: z.number().min(0),
    minQuantity: z.number().min(0),
    category: z.enum(['resale', 'internal']),
    barcode: z.string().optional()
});

type ProductFormType = z.infer<typeof productSchema>;

export default function StockPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'resale' | 'internal' | 'low'>('all');
    const [products, setProducts] = useState<any[]>([]);

    const loadProducts = async () => {
        const data = await api.getProducts();
        setProducts(data);
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;

        if (filter === 'resale') return p.category === 'resale';
        if (filter === 'internal') return p.category === 'internal';
        if (filter === 'low') return p.quantity <= p.minQuantity;
        return true;
    });

    const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductFormType>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            category: 'resale',
            quantity: 0,
            minQuantity: 5
        }
    });

    const onSubmit = async (data: ProductFormType) => {
        try {
            await api.addProduct(data);
            // Backend handles product creation. 
            // Ideally we would record movement too, but for basic backend we stick to CRUD Product
            setIsModalOpen(false);
            reset();
            loadProducts();
        } catch (error) {
            alert('Erro ao salvar produto');
        }
    };

    const handleAdjustStock = async (product: any, amount: number) => {
        const newQuantity = product.quantity + amount;
        if (newQuantity < 0) return alert("Estoque não pode ser negativo");

        try {
            await api.updateProduct(product.id, { quantity: newQuantity });
            loadProducts();
        } catch (e) {
            alert("Erro ao atualizar estoque.");
        }
    };

    const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'MZN' }).format(val);

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Controle de Estoque</h1>
                    <p className="text-sm text-gray-500">Gerencie produtos de venda e uso interno</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => window.print()} className="no-print border-gray-200">
                        <ArrowUp size={16} className="rotate-45" /> Exportar PDF
                    </Button>
                    <Button onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} />
                        Novo Produto
                    </Button>
                </div>
            </header>

            <div className="p-8 flex-1 overflow-auto">

                {/* Filters */}
                <div className="flex gap-4 mb-6 text-sm">
                    <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>Todos</FilterButton>
                    <FilterButton active={filter === 'resale'} onClick={() => setFilter('resale')}>Revenda</FilterButton>
                    <FilterButton active={filter === 'internal'} onClick={() => setFilter('internal')}>Uso Interno</FilterButton>
                    <FilterButton active={filter === 'low'} onClick={() => setFilter('low')} className="text-orange-600 border-orange-200 bg-orange-50 hover:bg-orange-100">
                        <AlertTriangle size={14} /> Estoque Baixo
                    </FilterButton>

                    <div className="ml-auto relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar produto..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                    </div>
                </div>

                {/* Products Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium">
                            <tr>
                                <th className="px-6 py-4">Produto</th>
                                <th className="px-6 py-4">Categoria</th>
                                <th className="px-6 py-4 text-center">Quantidade</th>
                                <th className="px-6 py-4 text-right">Preço Venda</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredProducts.map(mt => (
                                <tr key={mt.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4 font-medium text-gray-800">
                                        {mt.name}
                                        {mt.quantity <= mt.minQuantity && (
                                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                Baixo
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={clsx(
                                            "px-2 py-1 rounded-md text-xs font-semibold uppercase tracking-wide",
                                            mt.category === 'resale' ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600"
                                        )}>
                                            {mt.category === 'resale' ? 'Revenda' : 'Interno'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-3">
                                            <button onClick={() => handleAdjustStock(mt, -1)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"><ArrowDown size={14} /></button>
                                            <span className={clsx("font-bold w-8 text-center", mt.quantity === 0 ? "text-gray-300" : "text-gray-800")}>{mt.quantity}</span>
                                            <button onClick={() => handleAdjustStock(mt, 1)} className="p-1 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded"><ArrowUp size={14} /></button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-600">
                                        {formatMoney(mt.price)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {/* Edit/Delete would go here */}
                                    </td>
                                </tr>
                            ))}
                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                        <Package size={48} className="mx-auto mb-3 opacity-30" />
                                        <p>Nenhum produto encontrado.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* New Product Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Produto">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input label="Nome do Produto" placeholder="Ex: Shampoo Premium 500ml" {...register('name')} error={errors.name?.message} />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Categoria</label>
                            <select {...register('category')} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-200">
                                <option value="resale">Revenda (Para Cliente)</option>
                                <option value="internal">Uso Interno (Insumo)</option>
                            </select>
                        </div>
                        <Input label="Estoque Mínimo" type="number" {...register('minQuantity', { valueAsNumber: true })} />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <Input label="Custo (MT)" type="number" step="0.01" {...register('cost', { valueAsNumber: true })} />
                        <Input label="Venda (MT)" type="number" step="0.01" {...register('price', { valueAsNumber: true })} />
                        <Input label="Qtd Inicial" type="number" {...register('quantity', { valueAsNumber: true })} />
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit">Cadastrar Produto</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

function FilterButton({ children, active, onClick, className }: { children: React.ReactNode, active: boolean, onClick: () => void, className?: string }) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                "px-4 py-1.5 rounded-full border transition-all flex items-center gap-2",
                active ? "bg-purple-600 border-purple-600 text-white shadow-sm" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50",
                className
            )}
        >
            {children}
        </button>
    )
}
