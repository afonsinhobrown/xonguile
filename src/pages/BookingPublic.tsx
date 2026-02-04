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
    const handleBack = () => step === 2 && selectedService && initialQuery ? setStep(1) : setStep(s => s - 1);

    const handleTimeSelect = async (time: string) => {
        setSelectedTime(time);
        setFetchingProfs(true);
        try {
            const profs = await api.publicGetSlots(salonId!, selectedDate, time);
            setAvailableProfessionals(profs);
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
            const clientPayload: any = {
                name: String(clientData.name).trim(),
                phone: String(clientData.phone).trim()
            };
            if (clientData.email && clientData.email.includes('@')) clientPayload.email = clientData.email.trim();
            if ((hasCard || idVerified) && xonguileId) clientPayload.xonguileId = xonguileId.trim();

            const payload: any = {
                salonId: parseInt(salonId!),
                serviceId: parseInt(selectedService.id),
                date: selectedDate,
                time: selectedTime,
                clientData: clientPayload
            };
            if (selectedProfessional) payload.professionalId = parseInt(selectedProfessional.id);

            const res = await api.publicBook(payload);
            setResult(res);
            setStep(6);
        } catch (e: any) {
            console.error('API Error:', e);
            const msg = e.error || e.message || 'Erro no servidor (400). Verifique se preencheu tudo corretamente.';
            alert(`Atenção: ${msg}`);
        } finally { setIsBooking(false); }
    };

    const handleDownloadPDF = async () => {
        if (!ticketRef.current || !result) return;
        setLoading(true);

        setTimeout(async () => {
            try {
                const element = ticketRef.current!;
                const canvas = await html2canvas(element, {
                    scale: 3,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    onclone: (clonedDoc) => {
                        // THE ATOMIC FIX: Remove all OKLCH color functions from all stylesheets in the clone
                        const styleSheets = clonedDoc.styleSheets;
                        for (let i = 0; i < styleSheets.length; i++) {
                            try {
                                const sheet = styleSheets[i];
                                const rules = sheet.cssRules || sheet.rules;
                                for (let j = 0; j < rules.length; j++) {
                                    const rule = rules[j] as CSSStyleRule;
                                    if (rule.style && rule.style.cssText) {
                                        // Replace oklch() with a fallback hex color in the entire CSS rule string
                                        if (rule.style.cssText.includes('oklch')) {
                                            rule.style.cssText = rule.style.cssText.replace(/oklch\([^)]+\)/g, '#9333ea');
                                        }
                                    }
                                }
                            } catch (e) {
                                // Some stylesheets are cross-origin and can't be read, but that's okay
                            }
                        }
                    }
                });

                const imgData = canvas.toDataURL('image/png', 1.0);
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const ticketWidthOnPdf = 130;
                const ticketHeightOnPdf = (canvas.height * ticketWidthOnPdf) / canvas.width;
                const x = (pdfWidth - ticketWidthOnPdf) / 2;

                pdf.addImage(imgData, 'PNG', x, 15, ticketWidthOnPdf, ticketHeightOnPdf);
                pdf.save(`Ticket_Xonguile_${result.id}.pdf`);
            } catch (e: any) {
                console.error('PDF Error:', e);
                alert('Erro ao gerar PDF: ' + e.message);
            } finally { setLoading(false); }
        }, 500);
    };

    if (loading && step === 1) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans" style={{ color: '#111827' }}>
            <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-20 no-print">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <button onClick={() => step > 1 ? handleBack() : navigate('/explorar')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><ArrowLeft size={18} /></button>
                    <div className="text-center">
                        <h2 className="font-bold text-gray-900 text-sm leading-tight uppercase tracking-tight">{salon?.name || 'Agendamento'}</h2>
                        <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest block">Xonguile Partner</span>
                    </div>
                    <div className="w-10"></div>
                </div>
            </header>

            <main className="flex-1 max-w-2xl mx-auto w-full p-4 pb-32">
                {step < 6 && (
                    <div className="flex gap-2 mb-8 no-print">
                        {[1, 2, 3, 4, 5].map(s => <div key={s} className="h-1.5 flex-1 rounded-full bg-gray-200 overflow-hidden"><div className={clsx("h-full bg-purple-600 transition-all", s <= step ? 'w-full' : 'w-0')}></div></div>)}
                    </div>
                )}

                {step === 1 && (
                    <div className="space-y-4">
                        <h3 className="text-2xl font-black text-gray-900">Selecione o Serviço</h3>
                        <div className="grid gap-3">
                            {filteredServices.map((s: any) => (
                                <button key={s.id} onClick={() => { setSelectedService(s); handleNext(); }} className={clsx("p-5 rounded-[2rem] border-2 text-left bg-white transition-all shadow-sm", selectedService?.id === s.id ? 'border-purple-600' : 'border-transparent')}>
                                    <div className="flex justify-between items-center">
                                        <div><p className="font-bold text-gray-900">{s.name}</p><p className="text-xs text-gray-500">{s.duration} min</p></div>
                                        <p className="font-black text-purple-600">MZN {s.price}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <h3 className="text-2xl font-black text-gray-900">Data e Hora</h3>
                        <input type="date" min={DateTime.now().toISODate()} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full bg-white p-5 rounded-[2rem] shadow-sm outline-none border-none font-bold text-lg" />
                        {fetchingSlots ? <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-purple-600" /></div> : (
                            <div className="grid grid-cols-3 gap-3">
                                {availableSlots.map(time => (
                                    <button key={time} onClick={() => handleTimeSelect(time)} className={clsx("py-4 rounded-2xl font-bold transition-all text-sm", selectedTime === time ? 'bg-purple-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-purple-50')}>
                                        {time}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        <h3 className="text-2xl font-black text-gray-900">Escolha o Profissional</h3>
                        <div className="grid gap-3">
                            {availableProfessionals.map(p => (
                                <button key={p.id} onClick={() => { setSelectedProfessional(p); handleNext(); }} className={clsx("p-5 rounded-[2.5rem] bg-white border-2 flex items-center gap-4 text-left shadow-sm", selectedProfessional?.id === p.id ? 'border-purple-600' : 'border-transparent')}>
                                    <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xl", p.color || 'bg-purple-600')}>{p.name[0]}</div>
                                    <div><p className="font-bold text-gray-900 text-lg">{p.name}</p><p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{p.role}</p></div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-6">
                        <h3 className="text-2xl font-black text-gray-900 mb-8 tracking-tight">Identificação Digital</h3>
                        <div className="grid gap-4">
                            <button onClick={() => { setHasCard(true); handleNext(); }} className="p-8 rounded-[2.5rem] bg-white text-left shadow-sm border border-gray-50 flex items-center gap-5 group transition-all">
                                <div className="w-14 h-14 bg-purple-50 group-hover:bg-purple-600 group-hover:text-white rounded-2xl flex items-center justify-center text-purple-600 transition-all"><CreditCard size={28} /></div>
                                <div><h4 className="font-black text-xl text-gray-900">Tenho Xonguile ID</h4><p className="text-sm text-gray-500">Recuperar meus dados</p></div>
                            </button>
                            <button onClick={() => { setHasCard(false); handleNext(); }} className="p-8 rounded-[2.5rem] bg-white text-left shadow-sm border border-gray-50 flex items-center gap-5 group transition-all">
                                <div className="w-14 h-14 bg-gray-50 group-hover:bg-purple-600 group-hover:text-white rounded-2xl flex items-center justify-center text-gray-600 transition-all"><User size={28} /></div>
                                <div><h4 className="font-black text-xl text-gray-900">Sou nova / Sem ID</h4><p className="text-sm text-gray-500">Criar no momento</p></div>
                            </button>
                        </div>
                    </div>
                )}

                {step === 5 && (
                    <div className="space-y-6">
                        {hasCard ? (
                            <div className="space-y-4">
                                {!idVerified ? (
                                    <>
                                        <h3 className="text-2xl font-black text-gray-900">Carteira Digital</h3>
                                        <Input label="Seu ID Xonguile" placeholder="Ex: XON-N5UZ2F" value={xonguileId} onChange={(e: any) => setXonguileId(e.target.value)} />
                                        <Button className="w-full py-5 rounded-3xl text-lg font-black bg-purple-600 text-white" onClick={handleClientLookup} disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : 'Validar Identidade'}</Button>
                                    </>
                                ) : (
                                    <>
                                        <div className="bg-green-50 p-10 rounded-[2.5rem] text-center border-2 border-green-100 animate-in zoom-in">
                                            <div className="w-20 h-20 bg-green-500 text-white rounded-3xl flex items-center justify-center mb-5 mx-auto shadow-lg shadow-green-200"><UserCheck size={40} /></div>
                                            <h4 className="text-xl font-black text-green-900">Bem-vinda, {clientData.name.split(' ')[0]}!</h4>
                                            <p className="text-green-700 font-bold mt-1">{clientData.name}</p>
                                        </div>
                                        <Button className="w-full py-5 rounded-[2.5rem] text-lg font-black shadow-xl shadow-purple-600/20 bg-purple-600 text-white" onClick={handleFinalize} disabled={isBooking}>{isBooking ? <Loader2 className="animate-spin" /> : 'Confirmar Reserva'}</Button>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <h3 className="text-2xl font-black text-gray-900">Dados de Reserva</h3>
                                <div className="space-y-3">
                                    <Input label="Nome Completo" value={clientData.name} onChange={(e: any) => setClientData({ ...clientData, name: e.target.value })} required />
                                    <Input label="Telemóvel" value={clientData.phone} onChange={(e: any) => setClientData({ ...clientData, phone: e.target.value })} required />
                                    <Input label="Email (Opcional)" value={clientData.email} onChange={(e: any) => setClientData({ ...clientData, email: e.target.value })} />
                                </div>
                                <Button className="w-full py-5 rounded-[2.5rem] text-lg font-black mt-6 bg-purple-600 text-white shadow-lg" onClick={handleFinalize} disabled={isBooking}>{isBooking ? <Loader2 className="animate-spin" /> : 'Concluir Agendamento'}</Button>
                            </div>
                        )}
                    </div>
                )}

                {step === 6 && (
                    <div className="animate-in zoom-in duration-700 max-w-lg mx-auto pb-40">
                        <div className="no-print text-center mb-10">
                            <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-bounce"><CheckCircle size={40} /></div>
                            <h3 className="text-4xl font-black text-gray-900 tracking-tighter">Lugar Garantido!</h3>
                            <p className="text-gray-500 font-bold">Reserva confirmada no {salon?.name}.</p>
                        </div>

                        {/* NO-OKLCH TICKET - PURE HEX STYLES ONLY */}
                        <div ref={ticketRef} id="master-ticket" style={{
                            backgroundColor: '#ffffff', borderRadius: '50px', border: '1px solid #e2e8f0',
                            padding: '0', margin: '0 auto', width: '400px', maxWidth: '400px', minWidth: '400px',
                            boxShadow: '0 40px 80px rgba(0,0,0,0.12)', fontFamily: 'Helvetica, Arial, sans-serif',
                            position: 'relative'
                        }}>
                            <div style={{ backgroundColor: '#111827', padding: '45px 30px', color: '#ffffff', borderTopLeftRadius: '50px', borderTopRightRadius: '50px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '26px', fontWeight: '900', letterSpacing: '-1.5px' }}>Xonguile<span style={{ color: '#a855f7' }}>App</span></h4>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Recibo de Identidade Digital</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8', fontWeight: '900' }}>ID #</p>
                                        <p style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#a855f7' }}>{result?.id?.toString().padStart(4, '0')}</p>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '40px 30px' }}>
                                <div style={{ marginBottom: '35px' }}>
                                    <p style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#111827' }}>{salon?.name}</p>
                                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>#INCUBADORADESOLUÇÕES</p>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '35px', marginBottom: '35px' }}>
                                    <div>
                                        <p style={{ margin: '0 0 6px 0', fontSize: '9px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Serviço</p>
                                        <p style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#1e293b' }}>{selectedService?.name}</p>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: '900', color: '#9333ea' }}>MZN {selectedService?.price}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ margin: '0 0 6px 0', fontSize: '9px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Data e Hora</p>
                                        <p style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#1e293b' }}>{DateTime.fromISO(selectedDate).toFormat('dd MMM yyyy')}</p>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>{selectedTime}</p>
                                    </div>
                                </div>

                                <div style={{ backgroundColor: '#f8fafc', padding: '30px', borderRadius: '40px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ margin: '0 0 5px 0', fontSize: '9px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Titular da Conta</p>
                                        <p style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>{clientData.name}</p>
                                        <p style={{ margin: '8px 0 0 0', fontSize: '15px', color: '#9333ea', fontWeight: '900' }}>{result?.client?.xonguileId || xonguileId || 'XON-NEW-2026'}</p>
                                    </div>
                                    <div style={{ backgroundColor: '#ffffff', padding: '10px', borderRadius: '20px', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=111827&data=BOOKING:${result?.id}|ID:${result?.client?.xonguileId || xonguileId}`} style={{ width: '65px', height: '65px', display: 'block' }} />
                                    </div>
                                </div>

                                <div style={{ marginTop: '40px', textAlign: 'center', borderTop: '2px dashed #f1f5f9', paddingTop: '30px' }}>
                                    <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', margin: '0 0 15px 0' }}>Comprovativo aceite em todos os parceiros Xonguile.</p>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '900', color: '#9333ea' }}>Xonguile Network</span>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative notches */}
                            <div style={{ position: 'absolute', left: '-12px', top: '50%', width: '24px', height: '24px', backgroundColor: '#f9fafb', borderRadius: '50%', border: '1px solid #e2e8f0' }}></div>
                            <div style={{ position: 'absolute', right: '-12px', top: '50%', width: '24px', height: '24px', backgroundColor: '#f9fafb', borderRadius: '50%', border: '1px solid #e2e8f0' }}></div>
                        </div>

                        <div className="space-y-4 no-print px-6 mt-12">
                            <Button className="w-full flex items-center justify-center gap-3 py-8 rounded-[2.5rem] text-xl font-black bg-purple-600 text-white shadow-2xl shadow-purple-200 transition-all active:scale-95" onClick={handleDownloadPDF} disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" /> : <><Download size={26} /> Baixar Comprovativo PDF</>}
                            </Button>
                            <Link to="/explorar" className="block text-center py-4 text-gray-400 font-bold uppercase text-xs tracking-widest">Voltar ao Início</Link>
                        </div>
                    </div>
                )}

                {/* Bottom Bar Selection */}
                {step > 1 && step < 6 && selectedService && (
                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-6 shadow-2xl z-20 no-print animate-in slide-in-from-bottom-full">
                        <div className="max-w-2xl mx-auto flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><Scissors size={26} /></div>
                                <div><p className="font-bold text-gray-900 leading-none">{selectedService.name}</p><p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">{selectedTime && `${DateTime.fromISO(selectedDate).toFormat('dd MMM')} • ${selectedTime}`}</p></div>
                            </div>
                            <p className="text-2xl font-black text-purple-600">MZN {selectedService.price}</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
