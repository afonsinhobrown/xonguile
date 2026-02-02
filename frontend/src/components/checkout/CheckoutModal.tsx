import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Check, DollarSign, CreditCard, Smartphone, Banknote } from 'lucide-react';
import { clsx } from 'clsx';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointmentId: number | null;
}

export function CheckoutModal({ isOpen, onClose, appointmentId }: CheckoutModalProps) {
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'other'>('cash');
    const [appointment, setAppointment] = useState<any>(null);
    const [service, setService] = useState<any>(null);
    const [client, setClient] = useState<any>(null);

    useEffect(() => {
        if (isOpen && appointmentId) {
            loadDetails();
        }
    }, [isOpen, appointmentId]);

    const loadDetails = async () => {
        // Ideally we have getById endpoints, but for MVP we filter list
        const apps = await api.getAppointments();
        const app = apps.find((a: any) => a.id === appointmentId);
        setAppointment(app);

        if (app) {
            const services = await api.getServices();
            setService(services.find((s: any) => s.id === (app.ServiceId || app.serviceId)));

            const clients = await api.getClients();
            setClient(clients.find((c: any) => c.id === (app.ClientId || app.clientId)));
        }
    };

    const handleConfirmPayment = async () => {
        if (!appointment || !service) return;

        try {
            // 1. Update Appointment Status
            await api.updateAppointment(appointment.id, {
                status: 'completed'
            });

            // 2. Create Transaction Record
            await api.addTransaction({
                description: `Serviço: ${service.name} - ${client?.name || 'Cliente'}`,
                type: 'income',
                category: 'Serviços',
                amount: service.price,
                date: new Date(),
                paymentMethod: paymentMethod,
                referenceId: appointment.id
            });

            onClose();
        } catch (error) {
            console.error("Payment error:", error);
            alert("Erro ao processar pagamento.");
        }
    };

    if (!appointment || !service) return null;

    const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'MZN' }).format(val);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Finalizar Atendimento">
            <div className="space-y-6">
                {/* Summary Card */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-500 text-sm">Cliente</span>
                        <span className="font-medium text-gray-800">{client?.name || 'Cliente não identificado'}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-500 text-sm">Serviço</span>
                        <span className="font-medium text-gray-800">{service.name}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                        <span className="text-gray-800 font-bold">Total a Pagar</span>
                        <span className="text-purple-600 font-bold text-xl">{formatMoney(service.price)}</span>
                    </div>
                </div>

                {/* Payment Method Selection */}
                <div>
                    <label className="text-sm font-medium text-gray-700 block mb-3">Forma de Pagamento</label>
                    <div className="grid grid-cols-2 gap-3">
                        <PaymentOption
                            label="Dinheiro"
                            icon={<Banknote size={20} />}
                            selected={paymentMethod === 'cash'}
                            onClick={() => setPaymentMethod('cash')}
                        />
                        <PaymentOption
                            label="Cartão / POS"
                            icon={<CreditCard size={20} />}
                            selected={paymentMethod === 'card'}
                            onClick={() => setPaymentMethod('card')}
                        />
                        <PaymentOption
                            label="M-Pesa / E-Mola"
                            icon={<Smartphone size={20} />}
                            selected={paymentMethod === 'transfer'}
                            onClick={() => setPaymentMethod('transfer')}
                        />
                        <PaymentOption
                            label="Outro"
                            icon={<DollarSign size={20} />}
                            selected={paymentMethod === 'other'}
                            onClick={() => setPaymentMethod('other')}
                        />
                    </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleConfirmPayment} className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20">
                        <Check size={18} />
                        Receber {formatMoney(service.price)}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

function PaymentOption({ label, icon, selected, onClick }: { label: string, icon: React.ReactNode, selected: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                "flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-2",
                selected
                    ? "border-purple-500 bg-purple-50 text-purple-700 shadow-sm"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            )}
        >
            {icon}
            <span className="text-xs font-medium">{label}</span>
        </button>
    )
}
