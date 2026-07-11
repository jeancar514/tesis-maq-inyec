import { ServoRepository } from './servo.repository';
import { moldServoWebSocketService } from '../helpers/mold-servo-websocket.service';

/**
 * Repositorio del servomotor de cierre/molde (servomotor_2).
 * Reutiliza ServoRepository apuntando al endpoint y canal WS dedicados del
 * módulo Molde, en vez del servo de Inyección (servomotor_1).
 */
export class MoldServoRepository extends ServoRepository {
    constructor() {
        super('/api/mold-control/servo', moldServoWebSocketService);
    }
}
