import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Plus, Trash2, Tag, Sparkles, Wand2, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const serviceSchema = z.object({
    name: z.string().min(2, 'Nome muito curto'),
    price: z.number().min(0, 'Preço inválido'),
    duration: z.number().min(5, 'Duração mínima de 5 min'),
    active: z.boolean().default(true)
});

type ServiceFormType = z.infer<typeof serviceSchema>;

const PRESET_SERVICES = [
    { name: 'Corte Feminino Moderno', price: 800, duration: 45, cat: 'Cabelo' },
    { name: 'Corte Masculino Fade', price: 500, duration: 30, cat: 'Cabelo' },
    { name: 'Coloração Global', price: 2500, duration: 90, cat: 'Cabelo' },
    { name: 'Mechas Criativas', price: 4500, duration: 180, cat: 'Cabelo' },
    { name: 'Manicure & Pedicure', price: 600, duration: 60, cat: 'Unhas' },
    { name: 'Alongamento em Gel', price: 2500, duration: 120, cat: 'Unhas' },
    { name: 'Design de Sobrancelhas', price: 500, duration: 30, cat: 'Estética' },
    { name: 'Limpeza de Pele Profunda', price: 2500, duration: 90, cat: 'Estética' },
    { name: 'Massagem Relaxante', price: 1800, duration: 60, cat: 'Estética' },
];

export default function ServicesPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
    const [services, setServices] = useState<any[]>([]);
    const [addingPreset, setAddingPreset] = useState<string | null>(null);

    const loadServices = async () => {
        const data = await api.getServices();
        setServices(data);
    };

    useEffect(() => {
        loadServices();
    }, []);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<ServiceFormType>({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            duration: 30,
            active: true
        }
    });

    const onSubmit = async (data: ServiceFormType) => {
        try {
            await api.addService(data);
            setIsModalOpen(false);
            reset();
            loadServices();
        } catch (error) {
            alert('Erro ao salvar serviço');
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('Tem certeza?')) {
            await api.deleteService(id);
            loadServices();
        }
    };

    const addPreset = async (preset: any) => {
        setAddingPreset(preset.name);
        try {
            await api.addService(preset);
            loadServices();
        } catch (e) {
            alert('Falha ao adicionar serviço');
        } finally {
            setAddingPreset(null);
        }
    };

    const formatMoney = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'MZN' }).format(val);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Serviços e Preços</h1>
                    <p className="text-sm text-gray-500">O que o salão oferece?</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setIsPresetModalOpen(true)} className="border-purple-200 text-purple-700 hover:bg-purple-50">
                        <Wand2 size={18} />
                        Sugestões de Serviços
                    </Button>
                    <Button onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} />
                        Novo Serviço
                    </Button>
                </div>
            </header>

            <div className="p-8 flex-1 overflow-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {services.map((svc) => (
                        <div key={svc.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-2">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-gray-800 text-lg">{svc.name}</h3>
                                <button
                                    onClick={() => svc.id && handleDelete(svc.id)}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-sm font-bold">
                                    {formatMoney(svc.price)}
                                </span>
                                <span className="text-sm text-gray-500 flex items-center gap-1">
                                    <ClockIcon /> {svc.duration} min
                                </span>
                            </div>
                        </div>
                    ))}

                    {services.length === 0 && (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                            <Tag size={48} className="mb-4 opacity-50" />
                            <p className="text-lg font-medium">Nenhum serviço cadastrado</p>
                            <p className="text-sm">Cadastre seus preços para começar a vender.</p>
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Serviço">
                {/* ... existing form content ... */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="Nome do Serviço"
                        placeholder="Ex: Corte Masculino"
                        {...register('name')}
                        error={errors.name?.message}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Preço (MT)"
                            type="number"
                            placeholder="0.00"
                            {...register('price', { valueAsNumber: true })}
                            error={errors.price?.message}
                        />
                        <Input
                            label="Duração (min)"
                            type="number"
                            placeholder="30"
                            {...register('duration', { valueAsNumber: true })}
                            error={errors.duration?.message}
                        />
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit">Salvar</Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isPresetModalOpen} onClose={() => setIsPresetModalOpen(false)} title="Sugestões de Serviços">
                <div className="space-y-4 max-h-[60vh] overflow-auto pr-2">
                    <p className="text-sm text-gray-500 mb-4">Escolha os serviços que o seu salão oferece para adicionar rapidamente.</p>
                    <div className="grid gap-3">
                        {PRESET_SERVICES.map((p, i) => {
                            const exists = services.find(s => s.name === p.name);
                            return (
                                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-purple-200 transition-all">
                                    <div>
                                        <p className="font-bold text-gray-800">{p.name}</p>
                                        <p className="text-xs text-gray-500">{p.cat} • {p.duration} min • {formatMoney(p.price)}</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant={exists ? "secondary" : "primary"}
                                        disabled={!!exists || addingPreset === p.name}
                                        onClick={() => addPreset(p)}
                                    >
                                        {exists ? 'Adicionado' : addingPreset === p.name ? <Loader2 className="animate-spin" size={16} /> : 'Adicionar'}
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Modal>
        </div>
    );
}

function ClockIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
    )
}
