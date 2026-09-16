const { ccc } = require("@ckb-ccc/core");
const systemScripts = require("./system-scripts.json");

const DEVNET_SCRIPTS = {
  [ccc.KnownScript.Secp256k1Blake160]: systemScripts.devnet.secp256k1_blake160_sighash_all.script,
  [ccc.KnownScript.Secp256k1Multisig]: systemScripts.devnet.secp256k1_blake160_multisig_all.script,
  [ccc.KnownScript.AnyoneCanPay]: systemScripts.devnet.anyone_can_pay.script,
  [ccc.KnownScript.OmniLock]: systemScripts.devnet.omnilock.script,
  [ccc.KnownScript.XUdt]: systemScripts.devnet.xudt.script,
  [ccc.KnownScript.NervosDao]: systemScripts.devnet.dao.script,
};

// Test both ports
async function testPort(port) {
  console.log(`\n=== Testing port ${port} ===`);
  const client = new ccc.ClientPublicTestnet({
    url: `http://localhost:${port}`,
    scripts: DEVNET_SCRIPTS,
  });

  const privKey = "0x6109170b275a09ad54877b82f7d9930f88cab5717d484fb4741ae9d1dd078cd6";
  const signer = new ccc.SignerCkbPrivateKey(client, privKey);
  const lockScript = (await signer.getAddressObjSecp256k1()).script;
  const xudtArgs = lockScript.hash() + "00000000";
  
  const typeScript = await ccc.Script.fromKnownScript(
    signer.client,
    ccc.KnownScript.XUdt,
    xudtArgs
  );

  const tx = ccc.Transaction.from({
    outputs: [{ lock: lockScript, type: typeScript }],
    outputsData: [ccc.numLeToBytes("1", 16)],
  });

  await tx.addCellDepsOfKnownScripts(signer.client, ccc.KnownScript.XUdt);
  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, 1000);

  try {
    const txHash = await signer.sendTransaction(tx);
    console.log(`Port ${port}: SUCCESS - TX Hash: ${txHash}`);
    return true;
  } catch (e) {
    console.error(`Port ${port}: FAILED - ${e.message}`);
    return false;
  }
}

(async () => {
  await testPort(28114);
  await testPort(8114);
})();
