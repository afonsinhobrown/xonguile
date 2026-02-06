import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Plus, Search, User, Phone, Edit, Trash2, CreditCard } from 'lucide-react';
import { XonguileCard } from '../components/clients/XonguileCard';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Schema Validation
const clientSchema = z.object({
    name: z.string().min(3, 'Nome deve ter pelo menos 3 letras'),
    phone: z.string().min(9, 'Telefone inválido'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    notes: z.string().optional(),
});

type ClientFormType = z.infer<typeof clientSchema>;

export default function ClientsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [clients, setClients] = useState<any[]>([]);
    const [selectedClientForCard, setSelectedClientForCard] = useState<any>(null);

    const loadClients = async () => {
        const data = await api.getClients();
        setClients(data);
    };

    useEffect(() => {
        loadClients();
    }, []);

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(search.toLowerCase()) ||
        client.phone.includes(search)
    );

    const { register, handleSubmit, reset, formState: { errors } } = useForm<ClientFormType>({
        resolver: zodResolver(clientSchema)
    });

    const onSubmit = async (data: ClientFormType) => {
        try {
            await api.addClient(data);
            setIsModalOpen(false);
            reset();
            loadClients(); // Refresh list
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert('Erro ao salvar cliente!');
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('Tem certeza que deseja excluir este cliente?')) {
            await api.deleteClient(id);
            loadClients();
        }
    }

    return (
        <div className="flex flex-col h-full bg-gray-50">

            {/* Page Header */}
            <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
                    <p className="text-sm text-gray-500">Gerencie sua base de clientes fiéis</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} />
                    Novo Cliente
                </Button>
            </header>

            {/* Main Content */}
            <div className="p-8 flex-1 overflow-auto">

                {/* Search Bar */}
                <div className="mb-6 max-w-md relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                        placeholder="Buscar por nome ou telefone..."
                        className="pl-10 h-11"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Clients Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredClients.map((client) => (
                        <div key={client.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between group">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-lg">
                                    {client.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">{client.name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                        <Phone size={14} />
                                        <span>{client.phone}</span>
                                    </div>
                                    {client.email && <p className="text-xs text-gray-400 mt-1">{client.email}</p>}
                                </div>
                            </div>

                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <button className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => setSelectedClientForCard(client)}
                                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                    title="Ver Cartão Xonguile"
                                >
                                    <CreditCard size={16} />
                                </button>
                                <button
                                    onClick={() => client.id && handleDelete(client.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {filteredClients.length === 0 && (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                            <User size={48} className="mb-4 opacity-50" />
                            <p className="text-lg font-medium">Nenhum cliente encontrado</p>
                            <p className="text-sm">Cadastre o primeiro cliente para começar.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* New Client Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Novo Cliente"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="Nome Completo *"
                        placeholder="Ex: Maria Silva"
                        {...register('name')}
                        error={errors.name?.message}
                    />
                    <Input
                        label="Telefone (WhatsApp) *"
                        placeholder="Ex: 912345678"
                        {...register('phone')}
                        error={errors.phone?.message}
                    />
                    <Input
                        label="Email (Opcional)"
                        type="email"
                        placeholder="cliente@email.com"
                        {...register('email')}
                        error={errors.email?.message}
                    />
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Observações</label>
                        <textarea
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 min-h-[80px]"
                            placeholder="Alergias, preferências..."
                            {...register('notes')}
                        />
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit">Salvar Cliente</Button>
                    </div>
                </form>
            </Modal>

            {selectedClientForCard && (
                <XonguileCard
                    name={selectedClientForCard.name}
                    xonguileId={selectedClientForCard.xonguileId}
                    onClose={() => setSelectedClientForCard(null)}
                />
            )}
        </div>
    );
}
