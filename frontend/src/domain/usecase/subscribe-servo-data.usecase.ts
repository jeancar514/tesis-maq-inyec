import { ServoGateway } from '../gateway/servo.gateway';
import { ServoData } from '../models/servo.model';

export class SubscribeServoDataUseCase {
    constructor(private readonly servoGateway: ServoGateway) {}

    execute(callback: (data: ServoData) => void): () => void {
        this.servoGateway.connectWebSocket();
        return this.servoGateway.subscribeToServoData(callback);
    }

    disconnect(): void {
        // El gateway maneja la desconexión
    }
}
