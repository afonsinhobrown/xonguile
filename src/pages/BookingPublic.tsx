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
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useRef } from 'react';

const printStyles = `
@media print {
  nav, header, button, .no-print, .floating-summary {
    display: none !important;
  }
  body {
    background: white !important;
  }
  .print-only {
    display: block !important;
  }
  .receipt-card {
    border: 2px solid #f3f4f6 !important;
    box-shadow: none !important;
    margin: 0 !important;
    padding: 2rem !important;
    width: 100% !important;
    border-radius: 0 !important;
  }
}
.print-only { display: none; }
`;

export default function BookingPublicPage() {
    const { salonId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialQuery = searchParams.get('q') || '';
    const ticketRef = useRef<HTMLDivElement>(null);

    const [step, setStep] = useState(1);
    const [salon, setSalon] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Booking State
    const [selectedService, setSelectedService] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState(DateTime.now().toISODate());
    const [selectedTime, setSelectedTime] = useState('');
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [fetchingSlots, setFetchingSlots] = useState(false);
    const [availableProfessionals, setAvailableProfessionals] = useState<any[]>([]);
    const [fetchingProfs, setFetchingProfs] = useState(false);
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
            setFetchingSlots(true);
            api.publicGetSlots(salonId, selectedDate).then(slots => {
                setAvailableSlots(slots);
                setFetchingSlots(false);
            });
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

    const handleTimeSelect = async (time: string) => {
        setSelectedTime(time);
        setFetchingProfs(true);
        try {
            const profs = await api.publicGetSlots(salonId!, selectedDate, time);
            setAvailableProfessionals(profs);

            // AUTO-SKIP Step 3 if only 1 professional is available
            if (profs && profs.length === 1) {
                setSelectedProfessional(profs[0]);
                setStep(4); // Skip to Identity Choice
            } else {
                setStep(3);
            }
        } catch (e) {
            alert('Erro ao carregar profissionais.');
        } finally {
            setFetchingProfs(false);
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

    const handleDownloadPDF = async () => {
        if (!ticketRef.current) return;
        setLoading(true);
        try {
            const element = ticketRef.current;
            const canvas = await html2canvas(element, {
                scale: 3, // High quality
                useCORS: true,
                backgroundColor: '#ffffff'
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Reserva_Xonguile_XON-${result?.id?.toString().padStart(4, '0')}.pdf`);
        } catch (e) {
            console.error('Erro ao gerar PDF:', e);
            alert('Erro ao gerar PDF. Tente imprimir a página.');
        } finally {
            setLoading(false);
        }
    };

    if (loading && step === 1) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-purple-600" size={48} /></div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <style>{printStyles}</style>
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

                {/* Step Progress - Compressed if steps are skipped */}
                {step < 6 && (
                    <div className="flex gap-2 mb-8">
                        {[1, 2, 3, 4, 5].map(s => {
                            // Hide steps that are irrelevant due to pre-selection or auto-skip
                            const isServiceStepSkipped = s === 1 && initialQuery && selectedService;
                            const isProfStepSkipped = s === 3 && availableProfessionals.length === 1 && selectedProfessional;

                            if (isServiceStepSkipped || isProfStepSkipped) return null;

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

                        {fetchingSlots ? (
                            <div className="flex flex-col items-center py-12 text-gray-400 gap-3">
                                <Loader2 className="animate-spin text-purple-600" />
                                <p className="text-sm font-medium">Buscando horários disponíveis...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-2">
                                {availableSlots.map(time => (
                                    <button
                                        key={time}
                                        disabled={fetchingProfs}
                                        onClick={() => handleTimeSelect(time)}
                                        className={clsx(
                                            "py-4 rounded-2xl font-bold transition-all text-sm flex items-center justify-center",
                                            selectedTime === time ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 border border-gray-100',
                                            fetchingProfs && selectedTime === time && "opacity-50"
                                        )}
                                    >
                                        {fetchingProfs && selectedTime === time ? <Loader2 size={16} className="animate-spin" /> : time}
                                    </button>
                                ))}
                                {availableSlots.length === 0 && (
                                    <div className="col-span-3 text-center py-8 text-gray-400 text-sm italic">
                                        Nenhum horário disponível para esta data.
                                    </div>
                                )}
                            </div>
                        )}
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

                {/* STEP 6: SUCCESS / RECEIPT / TICKET */}
                {step === 6 && (
                    <div className="text-center space-y-10 animate-in zoom-in duration-500 max-w-lg mx-auto pb-10">
                        <div className="no-print">
                            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-2xl">
                                <CheckCircle size={48} />
                            </div>
                            <h3 className="text-4xl font-black text-gray-900 tracking-tight">Agendado!</h3>
                            <p className="text-gray-500 text-lg">Seu lugar está garantido no {salon?.name}.</p>
                        </div>

                        {/* PREMIUM RECEIPT CARD */}
                        <div ref={ticketRef} className="receipt-card bg-white rounded-[3rem] border border-gray-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] relative overflow-hidden text-left p-0 mx-auto max-w-md">
                            <div className="absolute top-0 right-0 p-8 no-print">
                                <div className="text-[10px] font-black text-purple-200 uppercase tracking-[0.2em] rotate-90 origin-right translate-x-4">#INCUBADORADESOLUÇÕES</div>
                            </div>

                            {/* Receipt Header */}
                            <div className="bg-gray-900 p-8 text-white flex justify-between items-center">
                                <div>
                                    <h4 className="text-2xl font-black tracking-tighter">Xonguile<span className="text-purple-400">App</span></h4>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Recibo de Agendamento Online</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">ID Reserva</p>
                                    <p className="text-lg font-mono font-black text-purple-400">XON-{result?.id?.toString().padStart(4, '0') || '0021'}</p>
                                </div>
                            </div>

                            <div className="p-8 space-y-8 relative">
                                {/* Salon Info */}
                                <div className="flex justify-between items-end border-b border-gray-100 pb-6">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Estabelecimento</p>
                                        <h5 className="text-2xl font-bold text-gray-800">{salon?.name}</h5>
                                        <p className="text-xs text-gray-500">{salon?.address || 'Moçambique'}</p>
                                    </div>
                                    <div className="text-right pb-1">
                                        <div className="text-[10px] font-black text-purple-600 uppercase tracking-widest">#INCUBADORADESOLUÇÕES</div>
                                    </div>
                                </div>

                                {/* Booking Details Grid */}
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Serviço Selecionado</p>
                                        <p className="text-lg font-bold text-gray-800 leading-tight">{selectedService?.name}</p>
                                        <p className="text-xs text-purple-600 font-black mt-1">MZN {selectedService?.price}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Data e Horário</p>
                                        <p className="text-lg font-bold text-gray-800">{DateTime.fromISO(selectedDate).toFormat('dd LLL yyyy')}</p>
                                        <p className="text-lg font-black text-gray-900">{selectedTime}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Profissional</p>
                                        <p className="text-lg font-bold text-gray-800 leading-tight">{selectedProfessional?.name || 'Qualquer disponível'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Duração Est.</p>
                                        <p className="text-lg font-bold text-gray-800">{selectedService?.duration} min</p>
                                    </div>
                                </div>

                                {/* Client Section / Card */}
                                <div className="pt-8 border-t border-dashed border-gray-200">
                                    <div className="bg-gray-50 p-6 rounded-3xl flex justify-between items-center group hover:bg-purple-50 transition-all">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-[10px] text-gray-400 font-bold uppercase">Cliente / Xonguile ID</p>
                                                <span className="px-2 py-0.5 bg-purple-600 text-[8px] text-white font-black rounded-full">GLOBAL</span>
                                            </div>
                                            <p className="text-xl font-black text-gray-900 leading-tight">{clientData.name.toUpperCase()}</p>
                                            <p className="font-mono font-bold text-purple-700 tracking-tighter">{result?.client?.xonguileId || xonguileId || 'XON-N5UZ2F'}</p>
                                            <div className="mt-4">
                                                <p className="text-[9px] font-black text-purple-400 tracking-[0.2em] uppercase">#INCUBADORADESOLUÇÕES</p>
                                            </div>
                                        </div>
                                        <div className="bg-white p-3 border border-gray-50 rounded-2xl shadow-xl">
                                            <img
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BOOKING:${result?.id}|SALON:${salon?.id}|ID:${result?.client?.xonguileId || xonguileId}`}
                                                alt="Booking QR"
                                                className="w-16 h-16 sm:w-20 sm:h-20"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 text-center space-y-2">
                                    <p className="text-[9px] text-gray-400 font-medium">Apresente este código no salão para identificação rápida.</p>
                                    <div className="flex items-center justify-center gap-2 border-t border-gray-50 pt-4">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Powered by</p>
                                        <span className="text-xs font-black text-purple-600 tracking-tighter">XonguileApp</span>
                                    </div>
                                </div>
                            </div>

                            {/* Ticket Notch Effect */}
                            <div className="absolute left-0 top-[35%] -translate-x-1/2 w-8 h-8 bg-gray-50 rounded-full border border-gray-100"></div>
                            <div className="absolute right-0 top-[35%] translate-x-1/2 w-8 h-8 bg-gray-50 rounded-full border border-gray-100"></div>
                        </div>

                        <div className="space-y-4 no-print px-6">
                            <Button className="w-full flex items-center justify-center gap-3 py-6 rounded-[2.5rem] text-lg font-black shadow-2xl shadow-purple-600/30 transition-transform active:scale-95" onClick={handleDownloadPDF} disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" /> : <><Download size={24} /> Descarregar PDF Real</>}
                            </Button>

                            <Link to="/explorar" className="block py-4 text-gray-400 hover:text-purple-600 font-black text-sm transition-colors uppercase tracking-[0.2em]">
                                ← Voltar para o início
                            </Link>
                        </div>
                    </div>
                )}

                {/* Booking Summary Box (Mobile Floating) */}
                {step > 1 && step < 5 && selectedService && (
                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-2xl z-20 animate-in slide-in-from-bottom-full duration-500 floating-summary">
                        <div className="max-w-2xl mx-auto flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                                    <Scissors size={20} />
                                </div>
                                <div className="max-w-[150px] sm:max-w-none">
                                    <p className="text-xs font-bold text-gray-800 truncate">{selectedService.name}</p>
                                    <p className="text-[10px] text-gray-500">
                                        {selectedTime && `${DateTime.fromISO(selectedDate).toFormat('dd/MM')} às ${selectedTime}`}
                                        {selectedProfessional && ` • ${selectedProfessional.name.split(' ')[0]}`}
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
