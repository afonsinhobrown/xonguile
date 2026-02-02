import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Plus, Trash2, Edit, Scissors } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { clsx } from 'clsx';

const professionalSchema = z.object({
    name: z.string().min(2, 'Nome muito curto'),
    role: z.string().min(2, 'Função obrigatória'),
    color: z.string().default('bg-gray-100'),
    active: z.boolean().default(true)
});

type ProfessionalFormType = z.infer<typeof professionalSchema>;

const COLORS = [
    { label: 'Roxo', value: 'bg-purple-100 border-purple-200 text-purple-900' },
    { label: 'Azul', value: 'bg-blue-100 border-blue-200 text-blue-900' },
    { label: 'Verde', value: 'bg-emerald-100 border-emerald-200 text-emerald-900' },
    { label: 'Rosa', value: 'bg-pink-100 border-pink-200 text-pink-900' },
    { label: 'Laranja', value: 'bg-orange-100 border-orange-200 text-orange-900' },
    { label: 'Amarelo', value: 'bg-yellow-100 border-yellow-200 text-yellow-900' },
];

export default function ProfessionalsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [professionals, setProfessionals] = useState<any[]>([]);

    const loadProfessionals = async () => {
        const data = await api.getProfessionals();
        setProfessionals(data);
    };

    useEffect(() => {
        loadProfessionals();
    }, []);

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ProfessionalFormType>({
        resolver: zodResolver(professionalSchema),
        defaultValues: {
            color: COLORS[0].value,
            active: true
        }
    });

    const selectedColor = watch('color');

    const onSubmit = async (data: ProfessionalFormType) => {
        try {
            await api.addProfessional(data);
            setIsModalOpen(false);
            reset();
            loadProfessionals();
        } catch (error) {
            alert('Erro ao salvar profissional');
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('Tem certeza? Isso pode afetar agendamentos passados.')) {
            await api.deleteProfessional(id);
            loadProfessionals();
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Profissionais</h1>
                    <p className="text-sm text-gray-500">Quem trabalha no salão?</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} />
                    Novo Profissional
                </Button>
            </header>

            <div className="p-8 flex-1 overflow-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {professionals.map((prof) => (
                        <div key={prof.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={clsx("w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-2 border-white shadow-sm", prof.color)}>
                                    {prof.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">{prof.name}</h3>
                                    <p className="text-sm text-gray-500">{prof.role}</p>
                                </div>
                            </div>

                            <div className="flex gap-1">
                                <button
                                    onClick={() => prof.id && handleDelete(prof.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {professionals.length === 0 && (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                            <Scissors size={48} className="mb-4 opacity-50" />
                            <p className="text-lg font-medium">Nenhum profissional cadastrado</p>
                            <p className="text-sm">Adicione sua equipe para liberar a agenda.</p>
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Profissional">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="Nome"
                        placeholder="Ex: Ana Silva"
                        {...register('name')}
                        error={errors.name?.message}
                    />
                    <Input
                        label="Função/Cargo"
                        placeholder="Ex: Cabeleireira"
                        {...register('role')}
                        error={errors.role?.message}
                    />

                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">Cor na Agenda</label>
                        <div className="flex gap-2 flex-wrap">
                            {COLORS.map(c => (
                                <button
                                    key={c.label}
                                    type="button"
                                    onClick={() => setValue('color', c.value)}
                                    className={clsx(
                                        "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                                        c.value.split(' ')[0],
                                        selectedColor === c.value ? "ring-2 ring-offset-2 ring-gray-400 border-gray-600" : "border-transparent"
                                    )}
                                    title={c.label}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit">Salvar</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
