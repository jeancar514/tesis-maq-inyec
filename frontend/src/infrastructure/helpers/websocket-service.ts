import { environment } from '../../environments/environment';

type MessageHandler<T> = (data: T) => void;

export class WebSocketService<T> {
    private ws: WebSocket | null = null;
    private reconnectTimeout: number | null = null;
    private messageHandlers: Set<MessageHandler<T>> = new Set();
    private reconnectDelay = 3000;
    private maxReconnectDelay = 30000;
    private currentReconnectDelay = this.reconnectDelay;
    private destroyed = false; // FIX 2: flag para evitar reconexión tras disconnect()

    constructor(private readonly path: string) {}

    connect(): void {
        if (this.destroyed) return;

        // FIX 1: también bloquear si está en proceso de conectar (CONNECTING = 0)
        if (
            this.ws?.readyState === WebSocket.OPEN ||
            this.ws?.readyState === WebSocket.CONNECTING
        ) return;

        // Limpiar instancia anterior si existe
        if (this.ws) {
            this.ws.onopen = null;
            this.ws.onmessage = null;
            this.ws.onerror = null;
            this.ws.onclose = null;
            this.ws = null;
        }

        const base = environment.apiUrl.replace(/\/$/, ''); // quitar trailing slash si existe
        const wsUrl = base.replace(/^http/, 'ws') + this.path;

        try {
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log(`WebSocket connected: ${this.path}`);
                this.currentReconnectDelay = this.reconnectDelay;
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.messageHandlers.forEach(handler => handler(data));
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            this.ws.onclose = () => {
                console.log(`WebSocket disconnected: ${this.path}`);
                // FIX 2: solo reconectar si no fue un disconnect() intencional
                if (!this.destroyed) {
                    this.scheduleReconnect();
                }
            };
        } catch (error) {
            console.error('Error creating WebSocket:', error);
            if (!this.destroyed) {
                this.scheduleReconnect();
            }
        }
    }

    private scheduleReconnect(): void {
        if (this.reconnectTimeout) return;

        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.currentReconnectDelay = Math.min(
                this.currentReconnectDelay * 1.5,
                this.maxReconnectDelay
            );
            this.connect();
        }, this.currentReconnectDelay);
    }

    disconnect(): void {
        this.destroyed = true; // FIX 2: marcar como destruido para parar reconexiones

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.ws) {
            this.ws.onopen = null;
            this.ws.onmessage = null;
            this.ws.onerror = null;
            this.ws.onclose = null; // quitar handler antes de cerrar para no disparar scheduleReconnect
            this.ws.close();
            this.ws = null;
        }
    }

    // Permite reconectar después de un disconnect() si es necesario
    reconnect(): void {
        this.destroyed = false;
        this.currentReconnectDelay = this.reconnectDelay;
        this.connect();
    }

    subscribe(handler: MessageHandler<T>): () => void {
        this.messageHandlers.add(handler);
        return () => {
            this.messageHandlers.delete(handler);
        };
    }

    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}