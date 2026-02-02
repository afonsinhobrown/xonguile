import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, User, Box } from 'lucide-react';
import { clsx } from 'clsx';
import { Modal } from '../components/ui/Modal';

export default function POSPage() {
    const [step, setStep] = useState<'selection' | 'summary' | 'payment'>('selection');

    // Data
    const [clients, setClients] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    // Cart State
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
    const [cart, setCart] = useState<{ id: number; type: 'service' | 'product'; name: string; price: number; quantity: number }[]>([]);
    const [paymentMethod, setPaymentMethod] = useState('Dinheiro');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [c, s, p] = await Promise.all([
            api.getClients(),
            api.getServices(),
            api.getProducts()
        ]);
        setClients(c);
        setServices(s.filter((i: any) => i.active !== false));
        setProducts(p.filter((i: any) => i.category === 'resale')); // Only resale products
    };

    const addToCart = (item: any, type: 'service' | 'product') => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id && i.type === type);
            if (existing) {
                return prev.map(i => i.id === item.id && i.type === type ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { id: item.id, type, name: item.name, price: item.price, quantity: 1 }];
        });
    };

    const removeFromCart = (index: number) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const handleFinishSale = async () => {
        try {
            const clientName = clients.find(c => c.id === selectedClientId)?.name || 'Consumidor Final';
            const description = `Venda PDV: ${cart.map(i => `${i.quantity}x ${i.name}`).join(', ')}`;

            // 1. Register Transaction
            await api.addTransaction({
                description: `${description} - ${clientName}`,
                type: 'income',
                amount: total,
                category: 'Venda Balcão',
                paymentMethod: paymentMethod,
                date: new Date()
            });

            // 2. Reduce Stock (if products)
            // Note: For MVP we loop. In production, backend should handle batch update.
            for (const item of cart) {
                if (item.type === 'product') {
                    const product = products.find(p => p.id === item.id);
                    if (product) {
                        await api.updateProduct(product.id, { quantity: product.quantity - item.quantity });
                    }
                }
            }

            alert('Venda realizada com sucesso!');
            setCart([]);
            setSelectedClientId(null);
            setStep('selection');
            loadData(); // Refresh stock
        } catch (error) {
            alert('Erro ao processar venda');
        }
    };

    const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'MZN' }).format(val);

    return (
        <div className="flex h-full bg-gray-50 overflow-hidden">
            {/* Left Side: Catalog */}
            <div className="flex-1 flex flex-col p-6 pr-3 overflow-hidden">
                <header className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Caixa / PDV</h1>
                    <p className="text-sm text-gray-500">Selecione serviços ou produtos para venda rápida</p>
                </header>

                <div className="flex-1 overflow-auto space-y-8 pr-2">

                    {/* Services Section */}
                    <section>
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <User size={16} /> Serviços
                        </h2>
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {services.map(svc => (
                                <button
                                    key={svc.id}
                                    onClick={() => addToCart(svc, 'service')}
                                    className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-purple-300 hover:shadow-md transition-all text-left group"
                                >
                                    <h3 className="font-bold text-gray-800 group-hover:text-purple-700">{svc.name}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{formatMoney(svc.price)}</p>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Products Section */}
                    <section>
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Box size={16} /> Produtos de Revenda
                        </h2>
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {products.map(prod => (
                                <button
                                    key={prod.id}
                                    onClick={() => addToCart(prod, 'product')}
                                    disabled={prod.quantity <= 0}
                                    className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <h3 className="font-bold text-gray-800 group-hover:text-blue-700">{prod.name}</h3>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-sm text-gray-500">{formatMoney(prod.price)}</span>
                                        <span className={clsx("text-xs px-1.5 py-0.5 rounded", prod.quantity > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                                            {prod.quantity} est.
                                        </span>
                                    </div>
                                </button>
                            ))}
                            {products.length === 0 && <p className="text-gray-400 text-sm">Nenhum produto cadastrado para revenda.</p>}
                        </div>
                    </section>

                </div>
            </div>

            {/* Right Side: Cart */}
            <div className="w-96 bg-white border-l border-gray-200 shadow-xl flex flex-col z-20">
                <div className="p-6 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200 mb-4 cursor-pointer hover:border-purple-300 transition-colors">
                        <User className="text-gray-400" />
                        <select
                            className="flex-1 bg-transparent outline-none text-sm font-medium text-gray-700"
                            value={selectedClientId || ''}
                            onChange={(e) => setSelectedClientId(Number(e.target.value) || null)}
                        >
                            <option value="">Consumidor Final (Sem cadastro)</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <h2 className="font-bold text-gray-800 flex items-center gap-2">
                        <ShoppingCart size={18} /> Carrinho de Compras
                    </h2>
                </div>

                <div className="flex-1 overflow-auto p-4 space-y-3">
                    {cart.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
                            <ShoppingBasketIcon />
                            <p className="mt-4 text-sm">Seu carrinho está vazio.</p>
                            <p className="text-xs">Clique nos itens ao lado para adicionar.</p>
                        </div>
                    )}
                    {cart.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group">
                            <div className="flex-1">
                                <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                                <p className="text-xs text-gray-500">
                                    {item.quantity}x {formatMoney(item.price)}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-800 text-sm">{formatMoney(item.price * item.quantity)}</span>
                                <button onClick={() => removeFromCart(index)} className="text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-200 space-y-4">
                    <div className="flex justify-between items-center text-lg font-bold text-gray-800">
                        <span>Total</span>
                        <span className="text-2xl text-purple-600">{formatMoney(total)}</span>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Pagamento</label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full p-3 rounded-lg border border-gray-300 bg-white font-medium text-gray-700 outline-none focus:ring-2 focus:ring-purple-400"
                        >
                            <option value="Dinheiro">Dinheiro</option>
                            <option value="Cartão">Cartão / POS</option>
                            <option value="M-Pesa">M-Pesa / E-Mola</option>
                        </select>
                    </div>

                    <Button
                        size="lg"
                        className="w-full py-4 text-lg shadow-purple-600/25"
                        disabled={cart.length === 0}
                        onClick={handleFinishSale}
                    >
                        Finalizar Venda
                    </Button>
                </div>
            </div>
        </div>
    );
}

function ShoppingBasketIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-20"><path d="m5 11 4-7" /><path d="m19 11-4-7" /><path d="M2 11h20" /><path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8c.9 0 1.8-.7 2-1.6l1.7-7.4" /><path d="m9 11 1 9" /><path d="m4.5 11.012-.1 5.86c-.15 4.905 4.8 5.128 7.6 5.128 2.8 0 7.75-.223 7.6-5.128l-.1-5.86" /></svg>
    )
}
