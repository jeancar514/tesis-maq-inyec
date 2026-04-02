import { ServoGateway } from '../gateway/servo.gateway';
import { ServoData } from '../models/servo.model';

export class GetServoDataUseCase {
    constructor(private readonly servoGateway: ServoGateway) {}

    async execute(): Promise<ServoData> {
        return await this.servoGateway.getServoData();
    }
}
