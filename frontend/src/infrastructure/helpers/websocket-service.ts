import { environment } from '../../environments/environment';

type MessageHandler<T> = (data: T) => void;

export class WebSocketService<T> {
    private ws: WebSocket | null = null;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private messageHandlers: Set<MessageHandler<T>> = new Set();
    private reconnectDelay = 3000;
    private maxReconnectDelay = 30000;
    private currentReconnectDelay = this.reconnectDelay;

    constructor(private readonly path: string) {}

    connect(): void {
        if (this.ws?.readyState === WebSocket.OPEN) return;

        const wsUrl = environment.apiUrl.replace(/^http/, 'ws') + this.path;
        
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
                this.scheduleReconnect();
            };
        } catch (error) {
            console.error('Error creating WebSocket:', error);
            this.scheduleReconnect();
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
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
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
