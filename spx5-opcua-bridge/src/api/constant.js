const ROUTES = {
    KPIS: '/api/kpis',
    SERVO: '/api/servo',
    OPERATION_MODE: '/api/operation-mode',
    CYCLE_COMMAND: '/api/cycle-command',
    SCREW_CONTROL: '/api/screw-control',
    MOLD_CONTROL: '/api/mold-control',
    CARRIAGE_CONTROL: '/api/carriage-control',
    EJECTOR_CONTROL: '/api/ejector-control'
};

const REGISTER_TYPES = {
    KPIS: 'kpis',
    SERVO: 'servo',
    OPERATION_MODE: 'operation_mode',
    CYCLE_COMMAND: 'cycle_command',
    SCREW_CONTROL: 'screw_control',
    MOLD_CONTROL: 'mold_control',
    CARRIAGE_CONTROL: 'carriage_control',
    EJECTOR_CONTROL: 'ejector_control'
};

module.exports = {
    ROUTES,
    REGISTER_TYPES
};
