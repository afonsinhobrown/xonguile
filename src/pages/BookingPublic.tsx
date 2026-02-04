import { useState, useEffect, useMemo } from 'react';
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
        if (!result) return;
        setLoading(true);

        try {
            // Create a completely isolated HTML document with ZERO Tailwind/oklch contamination
            const ticketHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #ffffff; padding: 20px; }
        .ticket { 
            width: 400px; 
            background: #ffffff; 
            border-radius: 40px; 
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.15);
            border: 1px solid #e5e7eb;
        }
        .header { 
            background: #111827; 
            padding: 40px 30px; 
            color: #ffffff; 
        }
        .header h1 { 
            font-size: 24px; 
            font-weight: 900; 
            margin-bottom: 5px;
        }
        .header .purple { color: #a855f7; }
        .header .subtitle { 
            font-size: 10px; 
            color: #94a3b8; 
            text-transform: uppercase;
            font-weight: bold;
        }
        .header .id { 
            text-align: right; 
            font-size: 16px; 
            font-weight: 900; 
            color: #a855f7; 
            margin-top: -30px;
        }
        .body { padding: 35px 30px; }
        .salon-name { 
            font-size: 22px; 
            font-weight: 900; 
            color: #111827; 
            margin-bottom: 5px;
        }
        .brand { 
            font-size: 11px; 
            color: #6b7280; 
            margin-bottom: 30px;
        }
        .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 25px; 
            margin-bottom: 30px;
        }
        .info-label { 
            font-size: 9px; 
            color: #9ca3af; 
            font-weight: bold; 
            text-transform: uppercase; 
            margin-bottom: 5px;
        }
        .info-value { 
            font-size: 16px; 
            font-weight: 900; 
            color: #1e293b; 
        }
        .info-value.purple { color: #9333ea; }
        .info-value.large { font-size: 20px; }
        .client-box { 
            background: #f8fafc; 
            padding: 25px; 
            border-radius: 30px; 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            border: 1px solid #f1f5f9;
        }
        .client-name { 
            font-size: 18px; 
            font-weight: 900; 
            color: #0f172a; 
            text-transform: uppercase; 
            margin-bottom: 8px;
        }
        .client-id { 
            font-size: 14px; 
            color: #9333ea; 
            font-weight: 900; 
        }
        .qr-box { 
            background: #ffffff; 
            padding: 10px; 
            border-radius: 15px; 
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }
        .qr-box img { 
            width: 60px; 
            height: 60px; 
            display: block; 
        }
    </style>
</head>
<body>
    <div class="ticket">
        <div class="header">
            <h1>Xonguile<span class="purple">App</span></h1>
            <div class="subtitle">Comprovativo de Reserva</div>
            <div class="id">#${String(result.app?.id || result.id || '0000').padStart(4, '0')}</div>
        </div>
        <div class="body">
            <div class="salon-name">${salon?.name || 'Salão'}</div>
            <div class="brand">#INCUBADORADESOLUÇÕES</div>
            
            <div class="info-grid">
                <div>
                    <div class="info-label">Serviço</div>
                    <div class="info-value">${selectedService?.name}</div>
                    <div class="info-value purple">MZN ${selectedService?.price}</div>
                </div>
                <div style="text-align: right;">
                    <div class="info-label">Data e Hora</div>
                    <div class="info-value">${DateTime.fromISO(selectedDate).toFormat('dd/MM/yyyy')}</div>
                    <div class="info-value large">${selectedTime}</div>
                </div>
            </div>
            
            <div class="client-box">
                <div>
                    <div class="info-label">Cliente</div>
                    <div class="client-name">${clientData.name}</div>
                    <div class="client-id">${result.client?.xonguileId || xonguileId || 'XON-NEW'}</div>
                </div>
                <div class="qr-box">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BOOKING:${result.app?.id || result.id}|${result.client?.xonguileId || xonguileId}" />
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;

            // Create invisible iframe to render the clean HTML
            const iframe = document.createElement('iframe');
            iframe.style.position = 'absolute';
            iframe.style.left = '-9999px';
            iframe.style.width = '500px';
            iframe.style.height = '800px';
            document.body.appendChild(iframe);

            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!iframeDoc) throw new Error('Não foi possível criar o documento PDF');

            iframeDoc.open();
            iframeDoc.write(ticketHTML);
            iframeDoc.close();

            // Wait for images to load
            await new Promise(resolve => setTimeout(resolve, 1000));

            const ticketElement = iframeDoc.querySelector('.ticket') as HTMLElement;
            if (!ticketElement) throw new Error('Elemento não encontrado');

            const canvas = await html2canvas(ticketElement, {
                scale: 3,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false
            });

            document.body.removeChild(iframe);

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const ticketWidthOnPdf = 130;
            const ticketHeightOnPdf = (canvas.height * ticketWidthOnPdf) / canvas.width;
            const x = (pdfWidth - ticketWidthOnPdf) / 2;

            pdf.addImage(imgData, 'PNG', x, 20, ticketWidthOnPdf, ticketHeightOnPdf);
            pdf.save(`Ticket_Xonguile_${result.app?.id || result.id}.pdf`);
        } catch (e: any) {
            console.error('PDF Catch:', e);
            alert('Erro ao gerar PDF: ' + e.message);
        } finally {
            setLoading(false);
        }
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
                    <div className="max-w-md mx-auto pb-40 text-center space-y-8">
                        <div className="animate-in zoom-in">
                            <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                                <CheckCircle size={40} />
                            </div>
                            <h3 className="text-3xl font-black text-gray-900">Confirmado!</h3>
                            <p className="text-gray-500 mt-2">Reserva garantida no {salon?.name}</p>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
                            <div className="space-y-4 text-left">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold">Serviço</p>
                                    <p className="font-black text-xl">{selectedService?.name}</p>
                                    <p className="text-purple-600 font-black">MZN {selectedService?.price}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold">Data</p>
                                        <p className="font-black">{DateTime.fromISO(selectedDate).toFormat('dd/MM/yyyy')}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold">Hora</p>
                                        <p className="font-black text-2xl">{selectedTime}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold">Cliente</p>
                                    <p className="font-black uppercase">{clientData.name}</p>
                                    <p className="text-purple-600 font-bold text-sm">{result?.client?.xonguileId || xonguileId}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 no-print">
                            <Button className="w-full py-6 rounded-[2rem] bg-purple-600 text-white font-black shadow-xl flex items-center justify-center gap-3" onClick={handleDownloadPDF} disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" /> : <><Download size={24} /> Baixar Comprovativo PDF</>}
                            </Button>
                            <Link to="/explorar" className="block text-gray-400 font-bold text-sm">Voltar ao Início</Link>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
