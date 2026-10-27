
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const REGISTERS_FILE = path.resolve(__dirname, '../../config/registers.json');

class RegisterManager {
    constructor() {
        this.registers = [];
        this.load();
    }

    load() {
        try {
            if (fs.existsSync(REGISTERS_FILE)) {
                const data = fs.readFileSync(REGISTERS_FILE, 'utf8');
                this.registers = JSON.parse(data);
                logger.info(`Loaded ${this.registers.length} registers from ${REGISTERS_FILE}`);
            } else {
                logger.warn(`Registers file not found: ${REGISTERS_FILE}`);
                this.registers = [];
            }
        } catch (error) {
            logger.error(`Error loading registers: ${error.message}`);
            this.registers = [];
        }
    }

    save() {
        try {
            fs.writeFileSync(REGISTERS_FILE, JSON.stringify(this.registers, null, 2), 'utf8');
            logger.info('Registers configuration saved to disk');
        } catch (error) {
            logger.error(`Error saving registers: ${error.message}`);
        }
    }

    getAll() {
        return this.registers;
    }

    getByName(name) {
        return this.registers.find(r => r.name.toLowerCase() === name.toLowerCase());
    }

    upsert(registerConfig) {
        const index = this.registers.findIndex(r => r.name.toLowerCase() === registerConfig.name.toLowerCase());

        if (index !== -1) {
            this.registers[index] = { ...this.registers[index], ...registerConfig };
        } else {
            this.registers.push(registerConfig);
        }
        this.save();
    }

    // Campos de configuración editables desde el módulo de Direcciones Modbus.
    // No se permite cambiar 'name' ni 'type' (definen la identidad/agrupación).
    static EDITABLE_FIELDS = [
        'description', 'modbusType', 'modbusAddress', 'opcuaDataType',
        'scaleFactor', 'unit', 'readable', 'writable', 'is32Bit', 'bitPosition'
    ];

    // Actualiza un registro EN SITIO (mutando el objeto existente) para que el
    // polling Modbus/OPC UA tome la nueva dirección sin reiniciar el bridge.
    updateRegister(name, patch) {
        const reg = this.registers.find(r => r.name.toLowerCase() === String(name).toLowerCase());
        if (!reg) return null;
        for (const key of RegisterManager.EDITABLE_FIELDS) {
            if (key in patch && patch[key] !== undefined) {
                reg[key] = patch[key];
            }
        }
        this.save();
        return reg;
    }
}

module.exports = new RegisterManager();
