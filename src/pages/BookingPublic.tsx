import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Scissors, CheckCircle, ArrowLeft, Loader2, CreditCard, Download, User, UserCheck } from 'lucide-react';
import { DateTime } from 'luxon';
import { clsx } from 'clsx';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function BookingPublicPage() {
    const { salonId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialQuery = searchParams.get('q') || '';
    const ticketRef = useRef<HTMLDivElement>(null);

    const [step, setStep] = useState(1);
    const [salon, setSalon] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [selectedService, setSelectedService] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState(DateTime.now().toISODate());
    const [selectedTime, setSelectedTime] = useState('');
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [fetchingSlots, setFetchingSlots] = useState(false);
    const [availableProfessionals, setAvailableProfessionals] = useState<any[]>([]);
    const [fetchingProfs, setFetchingProfs] = useState(false);
    const [selectedProfessional, setSelectedProfessional] = useState<any>(null);

    const [hasCard, setHasCard] = useState<boolean | null>(null);
    const [xonguileId, setXonguileId] = useState('');
    const [idVerified, setIdVerified] = useState(false);
    const [clientData, setClientData] = useState({ name: '', phone: '', email: '' });

    const [result, setResult] = useState<any>(null);
    const [isBooking, setIsBooking] = useState(false);

    const filteredServices = useMemo(() => {
        if (!salon?.Services) return [];
        if (!initialQuery) return salon.Services;
        return salon.Services.filter((s: any) => s.name.toLowerCase().includes(initialQuery.toLowerCase()));
    }, [salon, initialQuery]);

    useEffect(() => {
        if (salonId) {
            api.publicGetSalon(salonId).then(data => {
                setSalon(data);
                setLoading(false);
                if (initialQuery && data.Services) {
                    const matches = data.Services.filter((s: any) => s.name.toLowerCase().includes(initialQuery.toLowerCase()));
                    if (matches.length === 1) { setSelectedService(matches[0]); setStep(2); }
                }
            }).catch(e => { console.error(e); setLoading(false); });
        }
    }, [salonId, initialQuery]);

    useEffect(() => {
        if (salonId && selectedDate && step === 2) {
            setFetchingSlots(true);
            api.publicGetSlots(salonId, selectedDate).then(slots => {
                setAvailableSlots(slots || []);
                setFetchingSlots(false);
            }).catch(() => setFetchingSlots(false));
        }
    }, [salonId, selectedDate, step]);

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => step === 2 && selectedService && initialQuery ? setStep(1) : setStep(s => s - 1);

    const handleTimeSelect = async (time: string) => {
        setSelectedTime(time);
        setFetchingProfs(true);
        try {
            const profs = await api.publicGetSlots(salonId!, selectedDate, time);
            setAvailableProfessionals(profs || []);
            if (profs && profs.length === 1) { setSelectedProfessional(profs[0]); setStep(4); } else { setStep(3); }
        } catch (e) { alert('Erro ao carregar profissionais.'); } finally { setFetchingProfs(false); }
    };

    const handleClientLookup = async () => {
        if (!xonguileId) return;
        setLoading(true);
        try {
            const data = await api.publicClientLookup({ xonguileId });
            if (data) { setClientData({ name: data.name, phone: data.phone, email: data.email || '' }); setIdVerified(true); }
            else { alert('ID Xonguile não encontrado.'); }
        } catch (e) { alert('Erro ao buscar ID.'); } finally { setLoading(false); }
    };

    const handleFinalize = async () => {
        if (!selectedService || !selectedTime) return alert('Selecione todos os dados.');
        setIsBooking(true);
        try {
            const payload = {
                salonId: Number(salonId),
                serviceId: Number(selectedService.id),
                date: selectedDate,
                startTime: selectedTime,
                professionalId: selectedProfessional ? Number(selectedProfessional.id) : null,
                clientData: {
                    name: String(clientData.name).trim(),
                    phone: String(clientData.phone).trim(),
                    email: clientData.email ? String(clientData.email).trim() : '',
                    ...((hasCard || idVerified) ? { xonguileId: xonguileId.trim() } : {})
                }
            };
            const res = await api.publicBook(payload);
            setResult(res);
            setStep(6);
        } catch (e: any) {
            console.error('API Error:', e);
            alert(e.error || e.message || 'Falha ao agendar. Tente novamente.');
        } finally { setIsBooking(false); }
    };

    const handleDownloadPDF = async () => {
        if (!ticketRef.current || !result) return;
        setLoading(true);

        // REMOVE all modern styles temporarily if possible, or just use scale 2 for stability
        setTimeout(async () => {
            try {
                const element = ticketRef.current!;
                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    // This tells html2canvas to try and handle the colors more gracefully
                    onclone: (clonedDoc) => {
                        const styleTags = clonedDoc.getElementsByTagName('style');
                        for (let i = 0; i < styleTags.length; i++) {
                            if (styleTags[i].innerHTML.includes('oklch')) {
                                styleTags[i].remove(); // Kill the toxic CSS
                            }
                        }
                    }
                });

                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const ticketWidthOnPdf = 130;
                const ticketHeightOnPdf = (canvas.height * ticketWidthOnPdf) / canvas.width;
                const x = (pdfWidth - ticketWidthOnPdf) / 2;

                pdf.addImage(imgData, 'PNG', x, 20, ticketWidthOnPdf, ticketHeightOnPdf);
                pdf.save(`Ticket_XON_${result.id}.pdf`);
            } catch (e: any) {
                console.error('PDF Catch:', e);
                alert('Erro na geração. Tire um screenshot do bilhete.');
            } finally { setLoading(false); }
        }, 500);
    };

    if (loading && step === 1) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-purple-600" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-20 no-print">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <button onClick={() => step > 1 ? handleBack() : navigate('/explorar')} className="p-2"><ArrowLeft size={18} /></button>
                    <div className="text-center">
                        <h2 className="font-bold text-gray-900 text-sm">{salon?.name || 'Agendamento'}</h2>
                        <span className="text-[9px] font-black text-purple-600 uppercase">Xonguile Network</span>
                    </div>
                    <div className="w-10"></div>
                </div>
            </header>

            <main className="flex-1 max-w-2xl mx-auto w-full p-4 pb-32">
                {step < 6 && (
                    <div className="flex gap-2 mb-8 no-print">
                        {[1, 2, 3, 4, 5].map(s => <div key={s} className="h-1 bg-gray-200 flex-1 rounded-full"><div className={clsx("h-full bg-purple-600 rounded-full transition-all", s <= step ? 'w-full' : 'w-0')}></div></div>)}
                    </div>
                )}

                {step === 1 && (
                    <div className="space-y-4">
                        <h3 className="text-2xl font-black text-gray-900">Serviços</h3>
                        <div className="grid gap-3">
                            {filteredServices.map((s: any) => (
                                <button key={s.id} onClick={() => { setSelectedService(s); handleNext(); }} className={clsx("p-5 rounded-[2rem] border-2 text-left bg-white", selectedService?.id === s.id ? 'border-purple-600' : 'border-white shadow-sm')}>
                                    <div className="flex justify-between items-center">
                                        <p className="font-bold">{s.name}</p>
                                        <p className="font-black text-purple-600">MZN {s.price}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <h3 className="text-2xl font-black">Data e Hora</h3>
                        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full bg-white p-5 rounded-[2rem] border-none font-bold shadow-sm" />
                        <div className="grid grid-cols-3 gap-3">
                            {availableSlots.map(time => (
                                <button key={time} onClick={() => handleTimeSelect(time)} className={clsx("py-4 rounded-2xl font-bold transition-all", selectedTime === time ? 'bg-purple-600 text-white shadow-lg' : 'bg-white text-gray-700')}>
                                    {time}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        <h3 className="text-2xl font-black">Profissional</h3>
                        <div className="grid gap-3">
                            {availableProfessionals.map(p => (
                                <button key={p.id} onClick={() => { setSelectedProfessional(p); handleNext(); }} className={clsx("p-5 rounded-[2rem] bg-white border-2 flex items-center gap-4 text-left shadow-sm", selectedProfessional?.id === p.id ? 'border-purple-600' : 'border-transparent')}>
                                    <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white", p.color || 'bg-purple-500')}>{p.name[0]}</div>
                                    <p className="font-bold">{p.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-6">
                        <h3 className="text-2xl font-black mb-8">Quem é você?</h3>
                        <div className="grid gap-4">
                            <button onClick={() => { setHasCard(true); handleNext(); }} className="p-8 rounded-[2.5rem] bg-white shadow-sm flex items-center gap-5">
                                <CreditCard className="text-purple-600" size={32} />
                                <div><h4 className="font-black text-xl">Já tenho Xonguile ID</h4><p className="text-sm text-gray-500">Recuperar dados</p></div>
                            </button>
                            <button onClick={() => { setHasCard(false); handleNext(); }} className="p-8 rounded-[2.5rem] bg-white shadow-sm flex items-center gap-5">
                                <User className="text-gray-400" size={32} />
                                <div><h4 className="font-black text-xl">Sou nova / Sem ID</h4><p className="text-sm text-gray-500">Cadastrar agora</p></div>
                            </button>
                        </div>
                    </div>
                )}

                {step === 5 && (
                    <div className="space-y-6">
                        {hasCard ? (
                            <div className="space-y-4">
                                <h3 className="text-2xl font-black">Xonguile ID</h3>
                                <Input label="Seu Código" placeholder="XON-..." value={xonguileId} onChange={(e: any) => setXonguileId(e.target.value)} />
                                <Button className="w-full py-5 rounded-3xl font-black" onClick={handleClientLookup} disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : 'Verificar ID'}</Button>
                                {idVerified && (
                                    <div className="mt-6 p-8 bg-green-50 rounded-[2rem] text-center">
                                        <p className="font-black text-green-700">{clientData.name}</p>
                                        <Button className="w-full mt-4 bg-purple-600 text-white rounded-3xl py-4 font-black" onClick={handleFinalize} disabled={isBooking}>Finalizar Agendamento</Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <h3 className="text-2xl font-black">Dados Básicos</h3>
                                <Input label="Nome" value={clientData.name} onChange={(e: any) => setClientData({ ...clientData, name: e.target.value })} required />
                                <Input label="Telemóvel" value={clientData.phone} onChange={(e: any) => setClientData({ ...clientData, phone: e.target.value })} required />
                                <Button className="w-full py-5 rounded-[2.5rem] bg-purple-600 text-white font-black" onClick={handleFinalize} disabled={isBooking}>{isBooking ? <Loader2 className="animate-spin" /> : 'Confirmar Reserva'}</Button>
                            </div>
                        )}
                    </div>
                )}

                {step === 6 && (
                    <div className="max-w-md mx-auto pb-40 text-center">
                        <div className="mb-8 font-black text-green-500">Reserva Confirmada!</div>

                        <div ref={ticketRef} style={{
                            backgroundColor: '#ffffff', borderRadius: '40px', border: '1px solid #eee',
                            padding: '0', width: '400px', margin: '0 auto', textAlign: 'left',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontFamily: 'Arial'
                        }}>
                            <div style={{ backgroundColor: '#111', padding: '30px', color: 'white', borderTopLeftRadius: '40px', borderTopRightRadius: '40px' }}>
                                <div style={{ fontSize: '20px', fontWeight: '900' }}>Xonguile<span style={{ color: '#a855f7' }}>App</span></div>
                                <div style={{ fontSize: '10px', opacity: 0.6 }}>COMPROVATIVO DE RESERVA</div>
                            </div>
                            <div style={{ padding: '30px' }}>
                                <p style={{ margin: 0, fontWeight: '900', fontSize: '24px' }}>{salon?.name}</p>
                                <p style={{ margin: 0, fontSize: '11px', color: '#999' }}>#INCUBADORADESOLUÇÕES</p>

                                <div style={{ marginTop: '25px', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                                    <div><p style={{ margin: 0, fontSize: '10px', color: '#999' }}>SERVIÇO</p><p style={{ margin: 0, fontWeight: 'bold' }}>{selectedService?.name}</p></div>
                                    <div style={{ textAlign: 'right' }}><p style={{ margin: 0, fontSize: '10px', color: '#999' }}>HORA</p><p style={{ margin: 0, fontWeight: 'bold', fontSize: '18px' }}>{selectedTime}</p></div>
                                </div>
                                <div style={{ marginTop: '20px' }}><p style={{ margin: 0, fontSize: '10px', color: '#999' }}>DATA</p><p style={{ margin: 0, fontWeight: 'bold' }}>{DateTime.fromISO(selectedDate).toFormat('dd/MM/yyyy')}</p></div>

                                <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div><p style={{ margin: 0, fontSize: '10px', color: '#999' }}>CONTA</p><p style={{ margin: 0, fontWeight: '900', textTransform: 'uppercase' }}>{clientData.name}</p><p style={{ margin: 0, color: '#a855f7', fontWeight: 'bold' }}>{result?.client?.xonguileId || xonguileId}</p></div>
                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=XON-${result?.id}`} style={{ width: '60px', height: '60px', borderRadius: '10px' }} />
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 px-6 space-y-4 no-print">
                            <Button className="w-full py-6 rounded-[2rem] bg-purple-600 text-white font-black shadow-xl" onClick={handleDownloadPDF} disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" /> : 'Baixar PDF'}
                            </Button>
                            <Link to="/explorar" className="block text-gray-400 font-bold text-sm">Voltar ao Início</Link>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
