import { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from './ui/Button';

export default function VoiceCallComponent({ contactId, contactName, onPeerOpen }: { contactId: string; contactName: string; onPeerOpen?: (id: string) => void }) {
    const [peer, setPeer] = useState<Peer | null>(null);
    const [peerId, setPeerId] = useState<string>('');
    const [inCall, setInCall] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isAudioOn, setIsAudioOn] = useState(true);
    const [callDuration, setCallDuration] = useState(0);

    const localAudioRef = useRef<HTMLAudioElement>(null);
    const remoteAudioRef = useRef<HTMLAudioElement>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const callRef = useRef<Peer.DataConnection | null>(null);

    // Initialize PeerJS
    useEffect(() => {
        const newPeer = new Peer();

        newPeer.on('open', (id) => {
            setPeerId(id);
            console.log('Peer ID:', id);
            if (onPeerOpen) onPeerOpen(id);
        });

        newPeer.on('call', async (call) => {
            // Atender chamada recebida
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                localStreamRef.current = stream;
                call.answer(stream);

                call.on('stream', (remoteStream) => {
                    if (remoteAudioRef.current) {
                        remoteAudioRef.current.srcObject = remoteStream;
                    }
                });

                setInCall(true);
                callRef.current = call;
            } catch (error) {
                console.error('Erro ao acessar microfone:', error);
                alert('Permissão de microfone negada');
            }
        });

        setPeer(newPeer);

        return () => {
            newPeer.destroy();
        };
    }, []);

    // Timer de duração da chamada
    useEffect(() => {
        if (!inCall) return;
        const interval = setInterval(() => {
            setCallDuration((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [inCall]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStartCall = async () => {
        if (!peer || !contactId) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = stream;

            const call = peer.call(contactId, stream);

            call.on('stream', (remoteStream) => {
                if (remoteAudioRef.current) {
                    remoteAudioRef.current.srcObject = remoteStream;
                }
            });

            call.on('close', () => {
                handleEndCall();
            });

            setInCall(true);
            callRef.current = call;
        } catch (error) {
            console.error('Erro ao iniciar chamada:', error);
            alert('Não foi possível acessar o microfone');
        }
    };

    const handleEndCall = () => {
        if (callRef.current) {
            callRef.current.close();
        }
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        setInCall(false);
        setCallDuration(0);
        setIsMuted(false);
        setIsAudioOn(true);
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTracks = localStreamRef.current.getAudioTracks();
            audioTracks.forEach((track) => {
                track.enabled = !isMuted;
            });
            setIsMuted(!isMuted);
        }
    };

    const toggleAudio = () => {
        if (remoteAudioRef.current) {
            remoteAudioRef.current.muted = !isAudioOn;
            setIsAudioOn(!isAudioOn);
        }
    };

    if (!inCall) {
        return (
            <div className="p-6 bg-white rounded-2xl border-2 border-purple-200 text-center space-y-4">
                <Phone size={48} className="mx-auto text-purple-600" />
                <div>
                    <p className="text-lg font-bold text-gray-900">{contactName}</p>
                    <p className="text-xs text-gray-500 mt-1">ID: {peerId}</p>
                </div>
                <Button
                    onClick={handleStartCall}
                    disabled={!peerId || !contactId}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                >
                    <Phone size={20} />
                    Iniciar Chamada de Voz
                </Button>
                <audio ref={localAudioRef} autoPlay muted />
                <audio ref={remoteAudioRef} autoPlay />
            </div>
        );
    }

    return (
        <div className="p-6 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl text-white text-center space-y-4">
            <div className="space-y-2">
                <p className="text-lg font-bold">{contactName}</p>
                <div className="text-4xl font-black">{formatDuration(callDuration)}</div>
                <p className="text-sm text-purple-200">Chamada em andamento</p>
            </div>

            <div className="flex gap-3 justify-center">
                <button
                    onClick={toggleMute}
                    className={`p-4 rounded-full transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-purple-500 hover:bg-purple-700'
                        }`}
                    title={isMuted ? 'Desativar mute' : 'Ativar mute'}
                >
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>

                <button
                    onClick={toggleAudio}
                    className={`p-4 rounded-full transition-all ${!isAudioOn ? 'bg-red-500 text-white' : 'bg-purple-500 hover:bg-purple-700'
                        }`}
                    title={isAudioOn ? 'Desativar áudio' : 'Ativar áudio'}
                >
                    {isAudioOn ? <Volume2 size={24} /> : <VolumeX size={24} />}
                </button>

                <button
                    onClick={handleEndCall}
                    className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all"
                    title="Encerrar chamada"
                >
                    <PhoneOff size={24} />
                </button>
            </div>

            <audio ref={localAudioRef} autoPlay muted />
            <audio ref={remoteAudioRef} autoPlay />
        </div>
    );
}
