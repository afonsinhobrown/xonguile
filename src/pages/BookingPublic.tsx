import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import {
    Scissors, Calendar, Clock, User, CheckCircle, ArrowLeft,
    ArrowRight, Loader2, CreditCard, Download, Mail, Smartphone,
    UserCheck, AlertCircle
} from 'lucide-react';
import { DateTime } from 'luxon';
import { clsx } from 'clsx';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function BookingPublicPage() {
    const { salonId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialQuery = searchParams.get('q') || '';

    const [step, setStep] = useState(1);
    const [salon, setSalon] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Booking State
    const [selectedService, setSelectedService] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState(DateTime.now().toISODate());
    const [selectedTime, setSelectedTime] = useState('');
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [availableProfessionals, setAvailableProfessionals] = useState<any[]>([]);
    const [selectedProfessional, setSelectedProfessional] = useState<any>(null);

    // Client State
    const [hasCard, setHasCard] = useState<boolean | null>(null);
    const [xonguileId, setXonguileId] = useState('');
    const [idVerified, setIdVerified] = useState(false);
    const [clientData, setClientData] = useState({
        name: '',
        phone: '',
        email: ''
    });

    const [result, setResult] = useState<any>(null);
    const [isBooking, setIsBooking] = useState(false);

    // Filtered Services based on search query
    const filteredServices = useMemo(() => {
        if (!salon?.Services) return [];
        if (!initialQuery) return salon.Services;
        const q = initialQuery.toLowerCase();
        return salon.Services.filter((s: any) =>
            s.name.toLowerCase().includes(q)
        );
    }, [salon, initialQuery]);

    useEffect(() => {
        if (salonId) {
            api.publicGetSalon(salonId).then(data => {
                setSalon(data);
                setLoading(false);

                // If there's a search term and it narrows down to 1 service, auto-select it
                if (initialQuery && data.Services) {
                    const matches = data.Services.filter((s: any) =>
                        s.name.toLowerCase().includes(initialQuery.toLowerCase())
                    );
                    if (matches.length === 1) {
                        setSelectedService(matches[0]);
                        setStep(2); // Skip Step 1 (Service Selection)
                    }
                }
            });
        }
    }, [salonId, initialQuery]);

    useEffect(() => {
        if (salonId && selectedDate && step === 2) {
            api.publicGetSlots(salonId, selectedDate).then(setAvailableSlots);
        }
    }, [salonId, selectedDate, step]);

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => {
        if (step === 2 && selectedService && initialQuery) {
            setStep(1); // Allow going back to see all services even if pre-skipped
        } else {
            setStep(s => s - 1);
        }
    };

    const handleClientLookup = async () => {
        if (!xonguileId) return;
        setLoading(true);
        try {
            // Global Lookup: A single person is a client of all salons in the ecosystem
            const data = await api.publicClientLookup({ xonguileId });
            if (data) {
                setClientData({ name: data.name, phone: data.phone, email: data.email });
                setIdVerified(true);
                // Proceed directly to booking confirmation logic
            } else {
                alert('ID Xonguile não encontrado. Verifique se digitou corretamente.');
            }
        } catch (e) {
            alert('Erro ao buscar ID. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleFinalize = async () => {
        if (!selectedService || !selectedDate || !selectedTime) return alert('Por favor, selecione todos os dados.');
        setIsBooking(true);
        try {
            const data = {
                salonId: parseInt(salonId!),
                serviceId: selectedService.id,
                date: selectedDate,
                time: selectedTime,
                professionalId: selectedProfessional?.id,
                clientData: {
                    ...clientData,
                    xonguileId: (hasCard || idVerified) ? xonguileId : undefined
                }
            };
            const res = await api.publicBook(data);
            setResult(res);
            setStep(6);
        } catch (e: any) {
            alert(e.error || 'Falha ao agendar. Verifique os dados e tente novamente.');
        } finally {
            setIsBooking(false);
        }
    };

    if (loading && step === 1) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-purple-600" size={48} /></div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Nav */}
            <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <button onClick={() => step > 1 ? handleBack() : navigate('/explorar')} className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="text-center">
                        <h2 className="font-bold text-gray-800">{salon?.name || 'Carregando...'}</h2>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">Agendamento Online</p>
                    </div>
                    <div className="w-10"></div>
                </div>
            </header>

            <main className="flex-1 max-w-2xl mx-auto w-full p-4 pb-20">

                {/* Step Progress - Compressed if service pre-selected */}
                {step < 6 && (
                    <div className="flex gap-2 mb-8">
                        {[1, 2, 3, 4, 5].map(s => {
                            // If Step 1 was skipped, we still show the bar but it's always "full"
                            const isHidden = s === 1 && initialQuery && selectedService;
                            if (isHidden) return null;

                            return (
                                <div key={s} className={clsx("h-1.5 flex-1 rounded-full bg-gray-200 overflow-hidden")}>
                                    <div className={clsx("h-full bg-purple-600 transition-all duration-500", s <= step ? 'w-full' : 'w-0')}></div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* STEP 1: SERVICES (Hidden if skipped) */}
                {step === 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-gray-800">Escolha o serviço</h3>
                            {initialQuery && (
                                <button onClick={() => navigate(`/agendar/${salonId}`)} className="text-xs text-purple-600 font-bold">Ver Todos</button>
                            )}
                        </div>
                        <div className="grid gap-3">
                            {filteredServices.map((s: any) => (
                                <button
                                    key={s.id}
                                    onClick={() => { setSelectedService(s); handleNext(); }}
                                    className={clsx(
                                        "p-4 rounded-2xl border text-left transition-all",
                                        selectedService?.id === s.id ? 'border-purple-600 bg-purple-50' : 'border-gray-200 bg-white hover:border-purple-300'
                                    )}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-gray-800">{s.name}</p>
                                            <p className="text-xs text-gray-500">{s.duration} min</p>
                                        </div>
                                        <p className="font-bold text-purple-600">MZN {s.price}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 2: DATE & TIME */}
                {step === 2 && (
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold text-gray-800">Dia e Hora</h3>

                        <input
                            type="date"
                            min={DateTime.now().toISODate()}
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full bg-white p-4 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-purple-400 font-bold"
                        />

                        <div className="grid grid-cols-3 gap-2">
                            {availableSlots.map(time => (
                                <button
                                    key={time}
                                    onClick={async () => {
                                        setSelectedTime(time);
                                        const profs = await api.publicGetSlots(salonId!, selectedDate, time);
                                        setAvailableProfessionals(profs);
                                        handleNext();
                                    }}
                                    className={clsx(
                                        "py-4 rounded-2xl font-bold transition-all text-sm",
                                        selectedTime === time ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 border border-gray-100'
                                    )}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 3: SELECT PROFESSIONAL */}
                {step === 3 && (
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold text-gray-800">Escolha o Profissional</h3>
                        <div className="grid gap-3">
                            {availableProfessionals.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => { setSelectedProfessional(p); handleNext(); }}
                                    className={clsx(
                                        "p-4 rounded-2xl border flex items-center gap-4 text-left transition-all",
                                        selectedProfessional?.id === p.id ? 'border-purple-600 bg-purple-50' : 'border-gray-200 bg-white'
                                    )}
                                >
                                    <div className={clsx("w-12 h-12 rounded-full flex items-center justify-center font-bold text-white", p.color)}>
                                        {p.name[0]}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800">{p.name}</p>
                                        <p className="text-xs text-gray-500">{p.role}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 4: IDENTITY CHOICE */}
                {step === 4 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <h3 className="text-2xl font-bold text-gray-800">Agora, quem é você?</h3>
                        <p className="text-gray-500">Seu agendamento em Moçambique será unificado com seu Cartão Xonguile.</p>

                        <div className="grid gap-4">
                            <button
                                onClick={() => { setHasCard(true); handleNext(); }}
                                className="p-6 rounded-3xl bg-white border border-gray-200 hover:border-purple-400 text-left group transition-all shadow-sm"
                            >
                                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-4 transition-colors group-hover:bg-purple-600 group-hover:text-white">
                                    <CreditCard size={24} />
                                </div>
                                <h4 className="font-bold text-lg text-gray-800">Tenho Cartão Xonguile</h4>
                                <p className="text-sm text-gray-500">Usar meu ID digital (Global) para carregar meus dados.</p>
                            </button>

                            <button
                                onClick={() => { setHasCard(false); handleNext(); }}
                                className="p-6 rounded-3xl bg-white border border-gray-200 hover:border-purple-400 text-left group transition-all shadow-sm"
                            >
                                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-600 mb-4 transition-colors group-hover:bg-purple-600 group-hover:text-white">
                                    <User size={24} />
                                </div>
                                <h4 className="font-bold text-lg text-gray-800">Não tenho cartão / Sou novo</h4>
                                <p className="text-sm text-gray-500">Preencha os dados uma vez para ser agendado em qualquer lugar.</p>
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 5: FORM / ID INPUT */}
                {step === 5 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        {hasCard ? (
                            <div className="space-y-6">
                                {!idVerified ? (
                                    <div className="space-y-4">
                                        <h3 className="text-2xl font-bold text-gray-800">Digite seu ID Xonguile</h3>
                                        <p className="text-sm text-gray-500">Este ID é válido em qualquer salão ou parceiro da rede Xonguile.</p>
                                        <Input
                                            label="ID do Cartão"
                                            placeholder="Ex: XON-N5UZ2F"
                                            value={xonguileId}
                                            onChange={(e: any) => setXonguileId(e.target.value)}
                                        />
                                        <Button className="w-full py-4 text-lg font-bold" onClick={handleClientLookup} disabled={loading}>
                                            {loading ? <Loader2 className="animate-spin" /> : 'Verificar ID'}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex flex-col items-center text-center">
                                            <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-4 shadow-lg">
                                                <UserCheck size={32} />
                                            </div>
                                            <h3 className="text-xl font-bold text-emerald-900">ID Identificado!</h3>
                                            <p className="text-emerald-700 font-medium">{clientData.name}</p>
                                            <p className="text-xs text-emerald-600 mt-1">{clientData.phone}</p>
                                        </div>

                                        <Button className="w-full py-4 text-lg font-bold" onClick={handleFinalize} disabled={isBooking}>
                                            {isBooking ? <Loader2 className="animate-spin" /> : 'Finalizar Agendamento'}
                                        </Button>

                                        <button onClick={() => { setIdVerified(false); setClientData({ name: '', phone: '', email: '' }); }} className="flex items-center gap-2 text-gray-400 text-sm mx-auto font-medium">
                                            <AlertCircle size={14} /> Não é você? Trocar ID
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <h3 className="text-2xl font-bold text-gray-800">Seus Dados</h3>
                                <Input label="Nome Completo" value={clientData.name} onChange={(e: any) => setClientData({ ...clientData, name: e.target.value })} required placeholder="Como devemos te chamar?" />
                                <Input label="Telemóvel" value={clientData.phone} onChange={(e: any) => setClientData({ ...clientData, phone: e.target.value })} required placeholder="84 XXXXXXXX" />
                                <Input label="Email" value={clientData.email} onChange={(e: any) => setClientData({ ...clientData, email: e.target.value })} placeholder="Para receber lembretes" />

                                <div className="pt-4">
                                    <Button className="w-full py-4 text-lg font-bold" onClick={handleFinalize} disabled={isBooking}>
                                        {isBooking ? <Loader2 className="animate-spin" /> : 'Confirmar Agendamento'}
                                    </Button>
                                    <p className="text-[10px] text-gray-400 text-center mt-3">Sua conta será criada globalmente para uso em outros parceiros.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 6: SUCCESS */}
                {step === 6 && (
                    <div className="text-center space-y-8 animate-in zoom-in duration-500">
                        <div>
                            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-xl">
                                <CheckCircle size={40} />
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900">Agendado com sucesso!</h3>
                            <p className="text-gray-500 mt-2">Seu horário foi reservado no {salon?.name}.</p>
                        </div>

                        {result && result.client && (
                            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-2xl relative overflow-hidden group">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl"></div>
                                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl"></div>

                                <div className="relative">
                                    <div className="flex justify-between items-start mb-10">
                                        <div className="text-left">
                                            <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-1">Cartão Global</p>
                                            <h4 className="text-2xl font-black text-gray-800 tracking-tight">Xonguile<span className="text-purple-600">ID</span></h4>
                                        </div>
                                        <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center text-white font-black text-xl">X</div>
                                    </div>

                                    <div className="text-left mb-8">
                                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Titular</p>
                                        <p className="text-lg font-bold text-gray-800">{result.client.name.toUpperCase()}</p>
                                    </div>

                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-xs text-gray-400 font-bold uppercase mb-1">ID Único</p>
                                            <p className="text-xl font-mono font-black text-purple-700">{result.client.xonguileId || xonguileId}</p>
                                        </div>
                                        <div className="bg-white p-2 rounded-2xl shadow-inner border border-gray-50">
                                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${result.client.xonguileId || xonguileId}`} alt="QR" className="w-20 h-20" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <Button className="w-full flex items-center justify-center gap-2 py-4 rounded-3xl" onClick={() => window.print()}>
                                <Download size={20} />
                                Baixar Comprovativo PDF
                            </Button>
                        </div>

                        <div className="pt-4">
                            <Link to="/explorar" className="text-gray-400 hover:text-purple-600 font-bold flex items-center justify-center gap-1 transition-colors">
                                <ArrowLeft size={16} /> Voltar para o início
                            </Link>
                        </div>
                    </div>
                )}

                {/* Booking Summary Box (Mobile Floating) */}
                {step > 1 && step < 5 && selectedService && (
                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-2xl z-20 animate-in slide-in-from-bottom-full duration-500">
                        <div className="max-w-2xl mx-auto flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                                    <Scissors size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-800">{selectedService.name}</p>
                                    <p className="text-[10px] text-gray-500">
                                        {selectedTime && `${DateTime.fromISO(selectedDate).toFormat('dd/MM')} às ${selectedTime}`}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400">Total</p>
                                <p className="font-black text-purple-600">MZN {selectedService.price}</p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
