import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { MessageSquare, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export default function SuperAdminTickets() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'open' | 'closed' | 'all'>('open');
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        loadTickets();
        // Auto-refresh tickets a cada 5 segundos
        const interval = setInterval(loadTickets, 5000);
        return () => clearInterval(interval);
    }, [filter]);

    // Auto-refresh do ticket selecionado a cada 2 segundos
    useEffect(() => {
        if (!selectedTicket) return;
        const interval = setInterval(async () => {
            const data = await api.getSuperTickets?.() || [];
            const updated = data.find((t: any) => t.id === selectedTicket.id);
            if (updated) setSelectedTicket(updated);
        }, 2000);
        return () => clearInterval(interval);
    }, [selectedTicket?.id]);

    const loadTickets = async () => {
        setLoading(true);
        try {
            // Fetch all tickets (you need to add this endpoint)
            const data = await api.getSuperTickets?.() || [];
            let filtered = Array.isArray(data) ? data : [];
            if (filter === 'open') filtered = filtered.filter((t: any) => t.status === 'open');
            if (filter === 'closed') filtered = filtered.filter((t: any) => t.status === 'closed');
            setTickets(filtered);
        } catch (e) {
            console.error('Erro ao carregar tickets:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async () => {
        if (!replyText.trim() || !selectedTicket) return;
        setSending(true);
        try {
            await api.addTicketReply?.(selectedTicket.id, { message: replyText });
            setReplyText('');
            // Recarrega imediatamente o ticket para mostrar a nova mensagem
            const data = await api.getSuperTickets?.() || [];
            const updated = data.find((t: any) => t.id === selectedTicket.id);
            if (updated) setSelectedTicket(updated);
            loadTickets();
        } catch (e) {
            alert('Erro ao enviar resposta');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tickets List */}
            <div className="lg:col-span-1 space-y-3">
                <div className="flex gap-2 mb-4">
                    {['open', 'closed', 'all'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${filter === f
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {f === 'open' ? 'Abertos' : f === 'closed' ? 'Fechados' : 'Todos'}
                        </button>
                    ))}
                </div>

                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500">Carregando...</div>
                    ) : tickets.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">Nenhum ticket</div>
                    ) : (
                        tickets.map(ticket => (
                            <button
                                key={ticket.id}
                                onClick={() => setSelectedTicket(ticket)}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedTicket?.id === ticket.id
                                        ? 'border-purple-600 bg-purple-50'
                                        : 'border-gray-200 hover:border-purple-300'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900">{ticket.subject}</p>
                                        <p className="text-xs text-gray-500 mt-1">{ticket.Salon?.name || 'Sistema'}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(ticket.createdAt).toLocaleDateString('pt-PT')}
                                        </p>
                                    </div>
                                    <div className={`px-2 py-1 rounded text-xs font-bold ${ticket.status === 'open'
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-green-100 text-green-700'
                                        }`}>
                                        {ticket.status === 'open' ? 'Aberto' : 'Fechado'}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Ticket Details */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
                {selectedTicket ? (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-2xl font-black text-gray-900">{selectedTicket.subject}</h3>
                            <p className="text-sm text-gray-500 mt-2">
                                {selectedTicket.Salon?.name} • {new Date(selectedTicket.createdAt).toLocaleDateString('pt-PT')}
                            </p>
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                            <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>
                        </div>

                        {/* Messages */}
                        <div className="space-y-3 max-h-[300px] overflow-y-auto bg-gray-50 p-4 rounded-xl border border-gray-200">
                            {selectedTicket.Messages && selectedTicket.Messages.length > 0 ? (
                                selectedTicket.Messages.map((msg: any, idx: number) => (
                                    <div key={idx} className={`p-3 rounded-lg ${msg.isAdmin ? 'bg-purple-100 ml-8' : 'bg-white mr-8 border border-gray-200'
                                        }`}>
                                        <p className="text-xs font-bold text-gray-600 mb-1">
                                            {msg.isAdmin ? 'Super Admin' : 'Cliente'}
                                        </p>
                                        <p className="text-sm text-gray-800">{msg.message}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500">Nenhuma mensagem ainda</p>
                            )}
                        </div>

                        {/* Reply */}
                        {selectedTicket.status === 'open' && (
                            <div className="space-y-2 border-t border-gray-200 pt-4">
                                <textarea
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    placeholder="Digite sua resposta..."
                                    className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-purple-600 focus:outline-none resize-none"
                                    rows={4}
                                />
                                <Button
                                    onClick={handleReply}
                                    disabled={!replyText.trim() || sending}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold"
                                >
                                    {sending ? 'Enviando...' : 'Enviar Resposta'}
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-96 text-center">
                        <MessageSquare size={48} className="text-gray-300 mb-4" />
                        <p className="text-gray-500 font-bold">Selecione um ticket para visualizar</p>
                    </div>
                )}
            </div>
        </div>
    );
}
