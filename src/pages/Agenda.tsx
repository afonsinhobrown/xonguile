import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { DateTime } from 'luxon';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckoutModal } from '../components/checkout/CheckoutModal';

const HOURS = Array.from({ length: 11 }, (_, i) => i + 9); // 09:00 to 19:00

// --- Appointment Form Schema ---
const appointmentSchema = z.object({
    clientId: z.string().min(1, 'Selecione um cliente'),
    serviceId: z.string().min(1, 'Selecione um serviço'),
    professionalId: z.string().min(1, 'Selecione um profissional'),
    time: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido'),
    notes: z.string().optional()
});

type AppointmentFormType = z.infer<typeof appointmentSchema>;

export default function AgendaPage() {
    const [selectedDate, setSelectedDate] = useState(DateTime.now());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [preSelectedSlot, setPreSelectedSlot] = useState<{ professionalId?: number, time?: string } | null>(null);
    const [checkoutAppId, setCheckoutAppId] = useState<number | null>(null);

    // Data State
    const [appointments, setAppointments] = useState<any[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);

    // Loaders
    const loadData = async () => {
        const dateStr = selectedDate.toISODate();
        const [appsData, staffData, clientsData, svcsData] = await Promise.all([
            api.getAppointments(dateStr || undefined),
            api.getProfessionals(),
            api.getClients(),
            api.getServices()
        ]);
        setAppointments(appsData);
        setStaff(staffData.filter((s: any) => s.active));
        setClients(clientsData);
        setServices(services.length > 0 ? services : svcsData); // Cache services locally if already loaded? No, services can change.
        setServices(svcsData);
    };

    useEffect(() => {
        loadData();
    }, [selectedDate]);
    // Note: Optimally we only reload appointments when date changes, but professionals/services could change too. 
    // For simplicity reload all on date change is fine.

    // Form Setup
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<AppointmentFormType>({
        resolver: zodResolver(appointmentSchema)
    });

    const handleOpenModal = (professionalId?: number, time?: string) => {
        setPreSelectedSlot({ professionalId, time });
        if (professionalId) setValue('professionalId', professionalId.toString());
        if (time) setValue('time', time);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        reset();
        setPreSelectedSlot(null);
    };

    const handleAppointmentClick = (e: React.MouseEvent, app: any) => {
        e.stopPropagation();
        setCheckoutAppId(app.id!);
    };

    const onSubmit = async (data: AppointmentFormType) => {
        const service = services.find(s => s.id === Number(data.serviceId));
        if (!service) return;

        // Calculate End Time
        const [hours, minutes] = data.time.split(':').map(Number);
        const startDateTime = selectedDate.set({ hour: hours, minute: minutes });
        const endDateTime = startDateTime.plus({ minutes: service.duration });

        try {
            // VERIFICAÇÃO DE CONFLITO (Ponto 3)
            const hasConflict = appointments.some(app => {
                if (app.status === 'cancelled') return false;
                if ((app.ProfessionalId || app.professionalId) !== Number(data.professionalId)) return false;

                // Simplified overlap check for the day
                const appStart = app.startTime;
                const appEnd = app.endTime;
                const newStart = data.time;
                const newEnd = endDateTime.toFormat('HH:mm');

                return (newStart >= appStart && newStart < appEnd) || (newEnd > appStart && newEnd <= appEnd);
            });

            if (hasConflict) {
                alert("CONFLITO! Este profissional já tem um agendamento neste horário.");
                return;
            }

            await api.addAppointment({
                clientId: Number(data.clientId),
                professionalId: Number(data.professionalId),
                ServiceId: service.id!,
                serviceId: service.id!,
                date: selectedDate.toISODate() || '',
                startTime: data.time,
                endTime: endDateTime.toFormat('HH:mm'),
                status: 'scheduled',
                price: service.price,
                notes: data.notes
            });

            handleCloseModal();
            loadData();
        } catch (error) {
            console.error("Failed to schedule:", error);
            alert("Erro ao agendar!");
        }
    };

    const getClientName = (id: number) => clients.find(c => c.id === id)?.name || 'Cliente';
    const getServiceName = (id: number) => services.find(s => s.id === id)?.name || 'Serviço';

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-800">Agenda Diária</h1>
                    <div className="flex items-center bg-gray-100 rounded-full p-1 border border-gray-200">
                        <button
                            onClick={() => setSelectedDate(prev => prev.minus({ days: 1 }))}
                            className="p-1 rounded-full hover:bg-white hover:shadow-sm transition-all text-gray-500"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="px-4 text-sm font-medium text-gray-600 capitalize">
                            {selectedDate.toFormat('EEE, dd MMM', { locale: 'pt-BR' })}
                        </span>
                        <button
                            onClick={() => setSelectedDate(prev => prev.plus({ days: 1 }))}
                            className="p-1 rounded-full hover:bg-white hover:shadow-sm transition-all text-gray-500"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button onClick={() => handleOpenModal()}>
                        <Plus size={18} />
                        Novo Agendamento
                    </Button>
                </div>
            </header>

            {/* Calendar Grid - SCROLL LATERAL ADICIONADO */}
            <div className="flex-1 overflow-x-auto overflow-y-auto bg-gray-50 p-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-w-[1200px] overflow-hidden">

                    {/* Calendar Header (Staff Columns) */}
                    <div className="grid grid-cols-[80px_1fr] border-b border-gray-200 sticky top-0 bg-white z-20 shadow-sm">
                        <div className="p-4 border-r border-gray-100 bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center pt-6">Hora</div>
                        <div
                            className="grid divide-x divide-gray-100"
                            style={{ gridTemplateColumns: `repeat(${staff.length || 1}, minmax(0, 1fr))` }}
                        >
                            {staff.map(s => (
                                <div key={s.id} className="p-4 flex items-center gap-3 justify-center">
                                    <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center font-bold text-purple-900 border-2 border-white shadow-sm", s.color)}>
                                        {s.name.charAt(0)}
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-gray-800 text-sm">{s.name}</p>
                                        <p className="text-xs text-purple-600 font-medium">{s.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Calendar Body (Slots) */}
                    <div className="grid grid-cols-[80px_1fr] relative">
                        {/* Time Labels */}
                        <div className="border-r border-gray-100 bg-gray-50">
                            {HOURS.map(hour => (
                                <div key={hour} className="h-24 border-b border-gray-100 text-xs text-gray-400 font-medium text-center pt-2">
                                    {hour}:00
                                </div>
                            ))}
                        </div>

                        {/* Columns Container */}
                        <div
                            className="grid divide-x divide-gray-100 relative"
                            style={{ gridTemplateColumns: `repeat(${staff.length || 1}, minmax(0, 1fr))` }}
                        >

                            {/* Background Grid Lines */}
                            <div className="absolute inset-0 grid grid-rows-[repeat(11,6rem)] pointer-events-none z-0">
                                {HOURS.map(hour => (
                                    <div key={hour} className="border-b border-gray-50 h-full"></div>
                                ))}
                            </div>

                            {staff.map(s => (
                                <div key={s.id} className="relative h-[calc(11*6rem)] z-10 group bg-white/50">
                                    {/* Clickable Slots */}
                                    {HOURS.map((hour, i) => (
                                        <div
                                            key={i}
                                            onClick={() => handleOpenModal(s.id, `${hour}:00`)}
                                            className="h-24 w-full absolute top-[calc(i*6rem)] hover:bg-purple-50/50 transition-colors border-b border-transparent cursor-pointer"
                                            title={`Agendar com ${s.name} às ${hour}:00`}
                                        ></div>
                                    ))}

                                    {/* Render Appointments */}
                                    {appointments
                                        .filter(app => app.ProfessionalId === s.id || app.professionalId === s.id) // Support both cases
                                        .map(app => {
                                            const [startHour, startMinute] = app.startTime.split(':').map(Number);
                                            const [endHour, endMinute] = app.endTime.split(':').map(Number);

                                            const startOffsetMinutes = (startHour - 9) * 60 + startMinute;
                                            const topPosition = startOffsetMinutes * 0.1;

                                            const durationMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
                                            const height = durationMinutes * 0.1;

                                            return (
                                                <div
                                                    key={app.id}
                                                    onClick={(e) => handleAppointmentClick(e, app)}
                                                    className={clsx(
                                                        "absolute left-1 right-1 rounded-lg p-2 text-xs border-l-4 shadow-sm cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] overflow-hidden z-20",
                                                        app.status === 'completed' ? "bg-emerald-100 border-emerald-500 text-emerald-900" :
                                                            "bg-purple-100 border-purple-500 text-purple-900"
                                                    )}
                                                    style={{
                                                        top: `${topPosition}rem`,
                                                        height: `${height}rem`
                                                    }}
                                                    title={`${getClientName(app.ClientId || app.clientId)} - ${getServiceName(app.ServiceId || app.serviceId)}`}
                                                >
                                                    <div className="font-bold truncate">{getClientName(app.ClientId || app.clientId)}</div>
                                                    <div className="opacity-80 truncate text-[10px]">{getServiceName(app.ServiceId || app.serviceId)}</div>
                                                    <div className="flex items-center gap-1 opacity-70 text-[10px] font-medium mt-0.5">
                                                        <Clock size={10} />
                                                        {app.startTime} - {app.endTime}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            {/* New Appointment Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title="Novo Agendamento"
                className="max-w-lg"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Profissional</label>
                            <select
                                {...register('professionalId')}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                            >
                                <option value="">Selecione...</option>
                                {staff.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                                ))}
                            </select>
                            {errors.professionalId && <p className="text-xs text-red-500 mt-1">{errors.professionalId.message}</p>}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Horário</label>
                            <Input
                                type="time"
                                {...register('time')}
                                error={errors.time?.message}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Cliente</label>
                        <select
                            {...register('clientId')}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                        >
                            <option value="">Selecione um cliente...</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                            ))}
                        </select>
                        {errors.clientId && <p className="text-xs text-red-500 mt-1">{errors.clientId.message}</p>}
                        {(!clients || clients.length === 0) && (
                            <p className="text-xs text-orange-500 mt-1">Nenhum cliente cadastrado. Vá em 'Clientes' primeiro.</p>
                        )}
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Serviço</label>
                        <select
                            {...register('serviceId')}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                        >
                            <option value="">Selecione um serviço...</option>
                            {services.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.duration} min) - {s.price}</option>
                            ))}
                        </select>
                        {errors.serviceId && <p className="text-xs text-red-500 mt-1">{errors.serviceId.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Observações</label>
                        <textarea
                            {...register('notes')}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 min-h-[60px]"
                            placeholder="Alguma preferência especial?"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-4">
                        <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
                        <Button type="submit">Confirmar Agendamento</Button>
                    </div>

                </form>
            </Modal>

            <CheckoutModal
                isOpen={!!checkoutAppId}
                onClose={() => { setCheckoutAppId(null); loadData(); }}
                appointmentId={checkoutAppId}
            />
        </div>
    );
}
