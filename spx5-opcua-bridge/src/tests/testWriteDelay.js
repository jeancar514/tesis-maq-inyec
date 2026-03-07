const ModbusRTU = require("modbus-serial");
const client = new ModbusRTU();

async function test() {
    await client.connectTCP("192.168.15.10", { port: 502 });
    client.setID(1);

    console.log("Writing 88 to address 0...");
    await client.writeRegisters(0, [88]);

    console.log("Waiting 3 seconds...");
    await new Promise(resolve => setTimeout(resolve, 3000));

    const data0 = await client.readHoldingRegisters(0, 1);
    const data10 = await client.readHoldingRegisters(10, 1);
    const data20 = await client.readHoldingRegisters(20, 1);
    console.log("After 3s - Addr 0:", data0.data[0]);
    console.log("After 3s - Addr 10:", data10.data[0]);
    console.log("After 3s - Addr 20:", data20.data[0]);

    client.close();
}
test().catch(console.error);
