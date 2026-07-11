const ROUTES = {
    // Dashboard / General
    KPIS: '/api/kpis',
    OPERATION_MODE: '/api/operation-mode',
    CYCLE_COMMAND: '/api/cycle-command',
    STEP_CYCLE: '/api/dashboard/step-cycle',
    PHASE_TIMING: '/api/dashboard/phase-timing',

    // Inyección
    SERVO: '/api/servo',
    SCREW_CONTROL: '/api/screw-control',
    CARRIAGE_CONTROL: '/api/carriage-control',
    INJECTION_PROFILE: '/api/injection/injection-profile',
    HOLDING_PROFILE: '/api/injection/holding-profile',

    // Molde (cierre)
    MOLD_CONTROL: '/api/mold-control',
    MOLD_SERVO: '/api/mold-control/servo',
    CLAMP_CLOSING_PROFILE: '/api/clamp/closing-profile',
    CLAMP_OPENING_PROFILE: '/api/clamp/opening-profile',

    // Eyección
    EJECTOR_CONTROL: '/api/ejector-control',
    EJECTION_PROFILE: '/api/ejection/ejection-profile',

    // Temperaturas
    HEATING_ZONES: '/api/heating/zones',
    HEATING_DIAGNOSTIC: '/api/heating/diagnostic',

    // Configuración / mantenimiento
    REGISTERS: '/api/registers',
    DATA_SOURCE: '/api/config/data-source',
    CATALOGS: '/api/catalogos'
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
