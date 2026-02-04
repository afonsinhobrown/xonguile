import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import {
    Scissors, Calendar, Clock, User, CheckCircle, ArrowLeft,
    ArrowRight, Loader2, CreditCard, Download, Mail, Smartphone
} from 'lucide-react';
import { DateTime } from 'luxon';
import { clsx } from 'clsx';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function BookingPublicPage() {
    const { salonId } = useParams();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [salon, setSalon] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Booking State
    const [selectedService, setSelectedService] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState(DateTime.now().toISODate());
    const [selectedTime, setSelectedTime] = useState('');
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);

    // Client State
    const [hasCard, setHasCard] = useState<boolean | null>(null);
    const [xonguileId, setXonguileId] = useState('');
    const [clientData, setClientData] = useState({
        name: '',
        phone: '',
        email: ''
    });

    const [result, setResult] = useState<any>(null);
    const [isBooking, setIsBooking] = useState(false);

    useEffect(() => {
        if (salonId) {
            api.publicGetSalon(salonId).then(data => {
                setSalon(data);
                setLoading(false);
            });
        }
    }, [salonId]);

    useEffect(() => {
        if (salonId && selectedDate && step === 2) {
            api.publicGetSlots(salonId, selectedDate).then(setAvailableSlots);
        }
    }, [salonId, selectedDate, step]);

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const handleClientLookup = async () => {
        if (!xonguileId) return;
        setLoading(true);
        try {
            const data = await api.publicClientLookup({ xonguileId });
            if (data) {
                setClientData({ name: data.name, phone: data.phone, email: data.email });
                setStep(4);
            } else {
                alert('ID Xonguile não encontrado.');
            }
        } catch (e) {
            alert('Erro ao buscar ID.');
        } finally {
            setLoading(false);
        }
    };

    const handleFinalize = async () => {
        setIsBooking(true);
        try {
            const data = {
                salonId,
                serviceId: selectedService.id,
                date: selectedDate,
                startTime: selectedTime,
                clientData: {
                    ...clientData,
                    xonguileId: hasCard ? xonguileId : undefined
                }
            };
            const res = await api.publicBook(data);
            setResult(res);
            setStep(5);
        } catch (e: any) {
            alert(e.error || 'Falha ao agendar');
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
                    <button onClick={() => step > 1 && step < 5 ? handleBack() : navigate('/explorar')} className="p-2 hover:bg-gray-100 rounded-full">
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

                {/* Step Progress */}
                {step < 5 && (
                    <div className="flex gap-2 mb-8">
                        {[1, 2, 3, 4].map(s => (
                            <div key={s} className={clsx("h-1.5 flex-1 rounded-full bg-gray-200 overflow-hidden")}>
                                <div className={clsx("h-full bg-purple-600 transition-all duration-500", s <= step ? 'w-full' : 'w-0')}></div>
                            </div>
                        ))}
                    </div>
                )}

                {/* STEP 1: SERVICES */}
                {step === 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h3 className="text-2xl font-bold text-gray-800">Escolha o serviço</h3>
                        <div className="grid gap-3">
                            {salon?.Services?.map((s: any) => (
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
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <h3 className="text-2xl font-bold text-gray-800">Dia e Hora</h3>

                        <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-sm">
                            <label className="text-sm font-bold text-gray-500 mb-2 block">Data</label>
                            <input
                                type="date"
                                min={DateTime.now().toISODate()}
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full bg-gray-50 p-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-purple-400 font-bold text-gray-700"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {availableSlots.map(time => (
                                <button
                                    key={time}
                                    onClick={() => { setSelectedTime(time); handleNext(); }}
                                    className={clsx(
                                        "py-4 rounded-2xl font-bold transition-all text-sm",
                                        selectedTime === time ? 'bg-purple-600 text-white shadow-lg' : 'bg-white text-gray-700 border border-gray-100 hover:border-purple-300'
                                    )}
                                >
                                    {time}
                                </button>
                            ))}
                            {availableSlots.length === 0 && <p className="col-span-full py-8 text-center text-gray-400">Nenhum horário disponível para este dia.</p>}
                        </div>
                    </div>
                )}

                {/* STEP 3: IDENTITY CHOICE */}
                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <h3 className="text-2xl font-bold text-gray-800">Agora, quem é você?</h3>
                        <p className="text-gray-500">Para facilitar o seu atendimento, identifique-se abaixo.</p>

                        <div className="grid gap-4">
                            <button
                                onClick={() => { setHasCard(true); handleNext(); }}
                                className="p-6 rounded-3xl bg-white border border-gray-200 hover:border-purple-400 text-left group transition-all shadow-sm"
                            >
                                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-4 transition-colors group-hover:bg-purple-600 group-hover:text-white">
                                    <CreditCard size={24} />
                                </div>
                                <h4 className="font-bold text-lg text-gray-800">Tenho Cartão Xonguile</h4>
                                <p className="text-sm text-gray-500">Usar meu ID digital para carregar meus dados.</p>
                            </button>

                            <button
                                onClick={() => { setHasCard(false); handleNext(); }}
                                className="p-6 rounded-3xl bg-white border border-gray-200 hover:border-purple-400 text-left group transition-all shadow-sm"
                            >
                                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-600 mb-4 transition-colors group-hover:bg-purple-600 group-hover:text-white">
                                    <User size={24} />
                                </div>
                                <h4 className="font-bold text-lg text-gray-800">Não tenho cartão / Sou novo</h4>
                                <p className="text-sm text-gray-500">Preencher dados manualmente e ganhar um cartão.</p>
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 4: FORM / ID INPUT */}
                {step === 4 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        {hasCard ? (
                            <div className="space-y-4">
                                <h3 className="text-2xl font-bold text-gray-800">Digite seu ID Xonguile</h3>
                                <Input
                                    label="ID do Cartão"
                                    placeholder="Ex: XON-XXXXXX"
                                    value={xonguileId}
                                    onChange={(e: any) => setXonguileId(e.target.value)}
                                />
                                <Button className="w-full py-4 text-lg font-bold" onClick={handleClientLookup} disabled={loading}>
                                    {loading ? <Loader2 className="animate-spin" /> : 'Verificar ID'}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <h3 className="text-2xl font-bold text-gray-800">Dados do Cliente</h3>
                                <Input label="Nome Completo" value={clientData.name} onChange={(e: any) => setClientData({ ...clientData, name: e.target.value })} required placeholder="Como devemos te chamar?" />
                                <Input label="Telemóvel" value={clientData.phone} onChange={(e: any) => setClientData({ ...clientData, phone: e.target.value })} required placeholder="84 XXXXXXXX" />
                                <Input label="Email" value={clientData.email} onChange={(e: any) => setClientData({ ...clientData, email: e.target.value })} placeholder="Para receber seu cartão digital" />

                                <div className="pt-4">
                                    <Button className="w-full py-4 text-lg font-bold" onClick={handleFinalize} disabled={isBooking}>
                                        {isBooking ? <Loader2 className="animate-spin" /> : 'Confirmar Agendamento'}
                                    </Button>
                                    <p className="text-[10px] text-gray-400 text-center mt-3">Ao confirmar, você aceita receber seu cartão digital Xonguile.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 5: SUCCESS & CARD */}
                {step === 5 && (
                    <div className="text-center space-y-8 animate-in zoom-in duration-500">
                        <div>
                            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-xl">
                                <CheckCircle size={40} />
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900">Agendado com sucesso!</h3>
                            <p className="text-gray-500 mt-2">Pronto para ficar ainda mais incrível?</p>
                        </div>

                        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-2xl relative overflow-hidden group">
                            {/* Decorative elements */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl"></div>
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl"></div>

                            <div className="relative">
                                <div className="flex justify-between items-start mb-10">
                                    <div className="text-left">
                                        <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-1">Cartão Digital</p>
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
                                        <p className="text-xl font-mono font-black text-purple-700">{result.client.xonguileId}</p>
                                    </div>
                                    <div className="bg-white p-2 rounded-2xl shadow-inner border border-gray-50">
                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${result.client.xonguileId}`} alt="QR" className="w-20 h-20" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Button className="w-full flex items-center justify-center gap-2 py-4 rounded-3xl" onClick={() => window.print()}>
                                <Download size={20} />
                                Baixar Cartão Digital
                            </Button>
                            <div className="flex gap-2">
                                <Button variant="ghost" className="flex-1 flex items-center justify-center gap-2 border border-gray-200">
                                    <Mail size={18} />
                                    E-mail
                                </Button>
                                <Button variant="ghost" className="flex-1 flex items-center justify-center gap-2 border border-gray-200">
                                    <Smartphone size={18} />
                                    SMS
                                </Button>
                            </div>
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
