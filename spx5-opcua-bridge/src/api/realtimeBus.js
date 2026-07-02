// Bus de tiempo real desacoplado: los routers por módulo emiten eventos aquí y
// el ApiServer (dueño de los WebSocket) los reenvía a los clientes conectados.
// Evita acoplar los routers a la instancia del servidor WS.
const realtimeBus = {
    operationMode: (_mode) => {},   // sobrescrito por ApiServer
    cycleCommand: (_command) => {}, // sobrescrito por ApiServer
};

module.exports = realtimeBus;
