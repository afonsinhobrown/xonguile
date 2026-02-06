import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import {
    MessageCircle, Send, Clock, CheckCircle,
    AlertCircle, Search, Plus, User, Building,
    Shield, MessageSquare
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { clsx } from 'clsx';
import { DateTime } from 'luxon';

export default function SupportPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const user = JSON.parse(localStorage.getItem('salao_user') || '{}');
    const isSuper = user.role?.startsWith('super_');

    const loadTickets = async () => {
        try {
            const data = await api.getTickets();
            setTickets(data);
            if (selectedTicket) {
                const updated = data.find((t: any) => t.id === selectedTicket.id);
                if (updated) setSelectedTicket(updated);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        loadTickets();
        const interval = setInterval(loadTickets, 10000); // Auto-refresh for chat feeling
        return () => clearInterval(interval);
    }, [selectedTicket?.id]);

    const handleCreateTicket = async (e: any) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        try {
            setLoading(true);
            await api.addTicket(Object.fromEntries(formData));
            setIsCreateModalOpen(false);
            loadTickets();
        } catch (e) {
            alert('Erro ao criar ticket');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e: any) => {
        e.preventDefault();
        if (!message.trim() || !selectedTicket) return;
        try {
            await api.addTicketMessage(selectedTicket.id, message);
            setMessage('');
            loadTickets();
        } catch (e) {
            alert('Erro ao enviar mensagem');
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
            <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between shadow-sm shrink-0">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2">
                        <MessageCircle className="text-purple-600" />
                        {isSuper ? 'Central de Suporte Global' : 'Suporte Técnico'}
                    </h1>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                        {isSuper ? 'Gerencie pedidos de ajuda de todos os salões' : 'Fale diretamente com a equipa Xonguile'}
                    </p>
                </div>
                {!isSuper && (
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus size={18} />
                        Novo Pedido
                    </Button>
                )}
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Tickets List */}
                <div className="w-full md:w-80 lg:w-96 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar tickets..."
                                className="w-full bg-gray-50 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-purple-400 transition-all font-medium"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {tickets.length === 0 ? (
                            <div className="p-10 text-center opacity-30">
                                <MessageSquare size={48} className="mx-auto mb-4" />
                                <p className="font-bold uppercase text-[10px] tracking-widest">Nenhum ticket encontrado</p>
                            </div>
                        ) : (
                            tickets.map(ticket => (
                                <button
                                    key={ticket.id}
                                    onClick={() => setSelectedTicket(ticket)}
                                    className={clsx(
                                        "w-full p-5 text-left border-b border-gray-50 transition-all hover:bg-gray-50 flex items-start gap-4",
                                        selectedTicket?.id === ticket.id ? "bg-purple-50 border-r-4 border-r-purple-600" : ""
                                    )}
                                >
                                    <div className={clsx(
                                        "shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center",
                                        ticket.status === 'open' ? "bg-orange-100 text-orange-600" :
                                            ticket.status === 'resolved' ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400"
                                    )}>
                                        {ticket.status === 'open' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-black text-gray-800 text-sm truncate uppercase tracking-tight">{ticket.subject}</h3>
                                            <span className="text-[10px] text-gray-400 font-bold">{DateTime.fromISO(ticket.createdAt).toFormat('HH:mm')}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate mt-1">
                                            {ticket.Messages?.[ticket.Messages.length - 1]?.content || 'Sem mensagens'}
                                        </p>
                                        <div className="flex items-center gap-2 mt-3">
                                            <span className={clsx(
                                                "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                                                ticket.priority === 'urgent' ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"
                                            )}>
                                                {ticket.priority}
                                            </span>
                                            {isSuper && (
                                                <span className="text-[8px] font-black uppercase text-purple-600 flex items-center gap-1">
                                                    <Building size={10} /> {ticket.Salon?.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-white relative">
                    {selectedTicket ? (
                        <>
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-3xl flex items-center justify-center font-black">
                                        #{selectedTicket.id}
                                    </div>
                                    <div>
                                        <h2 className="font-black text-gray-900 uppercase tracking-tight">{selectedTicket.subject}</h2>
                                        <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-widest">
                                            <StatusDot status={selectedTicket.status} /> {selectedTicket.status} • {DateTime.fromISO(selectedTicket.createdAt).toFormat('dd MMM yyyy')}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {isSuper && selectedTicket.status !== 'resolved' && (
                                        <Button variant="secondary" className="text-emerald-600 border-emerald-100 hover:bg-emerald-50 text-xs py-2 h-auto" onClick={() => {/* Resolve API call */ }}>
                                            Marcar como Resolvido
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-6 flex flex-col-reverse">
                                {/* Reversed list + col-reverse is a trick to anchor search to bottom */}
                                <div className="flex flex-col gap-6">
                                    {selectedTicket.Messages?.map((msg: any) => {
                                        const isMine = msg.UserId === user.id;
                                        return (
                                            <div key={msg.id} className={clsx(
                                                "flex flex-col max-w-[80%]",
                                                isMine ? "self-end items-end" : "self-start items-start"
                                            )}>
                                                <div className={clsx(
                                                    "p-5 rounded-[2rem] text-sm font-medium shadow-sm leading-relaxed",
                                                    isMine ? "bg-purple-600 text-white rounded-tr-none" : "bg-gray-100 text-gray-800 rounded-tl-none"
                                                )}>
                                                    {msg.content}
                                                </div>
                                                <div className="flex items-center gap-2 mt-2 px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                    <span>{msg.senderRole === 'admin' ? 'SALÃO' : 'SUPORTE X'}</span>
                                                    <span>•</span>
                                                    <span>{DateTime.fromISO(msg.createdAt).toFormat('HH:mm')}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-gray-100 shrink-0">
                                <div className="relative group">
                                    <textarea
                                        rows={2}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Escreva a sua mensagem aqui..."
                                        className="w-full bg-gray-50 border border-transparent rounded-[2rem] py-4 pl-6 pr-16 text-sm font-medium outline-none focus:bg-white focus:border-purple-200 focus:ring-4 focus:ring-purple-500/5 transition-all resize-none shadow-inner"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage(e);
                                            }
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!message.trim()}
                                        className="absolute right-3 bottom-4 w-10 h-10 bg-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/20 hover:scale-105 active:scale-95 disabled:grayscale disabled:opacity-50 transition-all"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-20 text-center text-gray-300">
                            <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mb-8 border border-gray-100 shadow-inner">
                                <MessageCircle size={48} className="opacity-20" />
                            </div>
                            <h3 className="text-xl font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Canal de Atendimento</h3>
                            <p className="max-w-xs text-sm font-bold opacity-60">Selecione uma conversa ao lado para começar ou resolver um problema.</p>
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Abrir Novo Ticket">
                <form onSubmit={handleCreateTicket} className="space-y-4">
                    <Input label="Assunto / Tema" name="subject" placeholder="Ex: Problema com pagamento, Bug na agenda..." required />
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Prioridade</label>
                        <select name="priority" className="w-full h-11 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-bold">
                            <option value="low">Baixa</option>
                            <option value="medium">Média</option>
                            <option value="high">Alta</option>
                            <option value="urgent">URGENTE</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Descrição do Problema</label>
                        <textarea
                            name="content"
                            rows={4}
                            placeholder="Descreva detalhadamente..."
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                            required
                        />
                    </div>
                    <Button className="w-full py-4 font-black mt-4" disabled={loading}>
                        {loading ? <Clock className="animate-spin" /> : 'Enviar Solicitação'}
                    </Button>
                </form>
            </Modal>
        </div>
    );
}

function StatusDot({ status }: { status: string }) {
    return (
        <div className={clsx(
            "w-2 h-2 rounded-full",
            status === 'open' ? "bg-orange-500" :
                status === 'pending' ? "bg-indigo-500" :
                    status === 'resolved' ? "bg-emerald-500" : "bg-gray-400"
        )} />
    );
}
