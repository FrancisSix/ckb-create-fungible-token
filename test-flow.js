const { ccc } = require("@ckb-ccc/core");
const systemScripts = require("./system-scripts.json");

// Devnet scripts from system-scripts.json
const DEVNET_SCRIPTS = {
  [ccc.KnownScript.Secp256k1Blake160]: systemScripts.devnet.secp256k1_blake160_sighash_all.script,
  [ccc.KnownScript.Secp256k1Multisig]: systemScripts.devnet.secp256k1_blake160_multisig_all.script,
  [ccc.KnownScript.AnyoneCanPay]: systemScripts.devnet.anyone_can_pay.script,
  [ccc.KnownScript.OmniLock]: systemScripts.devnet.omnilock.script,
  [ccc.KnownScript.XUdt]: systemScripts.devnet.xudt.script,
  [ccc.KnownScript.NervosDao]: systemScripts.devnet.dao.script,
};

// Create client pointing to local devnet
const client = new ccc.ClientPublicTestnet({
  url: "http://localhost:28114",
  scripts: DEVNET_SCRIPTS,
});

// Account #0 private key
const senderPrivKey = "0x6109170b275a09ad54877b82f7d9930f88cab5717d484fb4741ae9d1dd078cd6";
// Account #1 address (receiver)
const receiverAddress = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqt435c3epyrupszm7khk6weq5lrlyt52lg48ucew";

async function main() {
  console.log("=== Step 1: Issue Custom Token ===");
  const signer = new ccc.SignerCkbPrivateKey(client, senderPrivKey);
  const lockScript = (await signer.getAddressObjSecp256k1()).script;
  const xudtArgs = lockScript.hash() + "00000000";
  console.log("Issuer Lock Script Hash:", lockScript.hash());
  console.log("xUDT Args:", xudtArgs);

  const typeScript = await ccc.Script.fromKnownScript(
    signer.client,
    ccc.KnownScript.XUdt,
    xudtArgs
  );
  console.log("Type Script codeHash:", typeScript.codeHash);

  const tx = ccc.Transaction.from({
    outputs: [{ lock: lockScript, type: typeScript }],
    outputsData: [ccc.numLeToBytes("42", 16)],
  });

  await tx.addCellDepsOfKnownScripts(signer.client, ccc.KnownScript.XUdt);
  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, 1000);

  const txHash = await signer.sendTransaction(tx);
  console.log("Issue TX Hash:", txHash);

  // Wait for mining
  console.log("Waiting for block...");
  await new Promise(r => setTimeout(r, 6000));

  // Check tx status
  const txResult = await client.getTransaction(txHash);
  console.log("TX Status:", txResult?.txStatus?.status);

  console.log("\n=== Step 2: Query Token Cells ===");
  const typeScriptForQuery = await ccc.Script.fromKnownScript(
    client,
    ccc.KnownScript.XUdt,
    xudtArgs
  );

  const cells = [];
  const collector = client.findCellsByType(typeScriptForQuery, true);
  for await (const cell of collector) {
    cells.push(cell);
  }
  console.log("Token cells found:", cells.length);
  if (cells.length > 0) {
    console.log("Token amount:", ccc.numLeFromBytes(cells[0].outputData).toString());
    console.log("Holder lock args:", cells[0].cellOutput.lock.args);
  }

  console.log("\n=== Step 3: Transfer Token ===");
  if (cells.length === 0) {
    console.log("ERROR: No token cells to transfer!");
    process.exit(1);
  }

  const receiverLockScript = (await ccc.Address.fromString(receiverAddress, client)).script;
  const xUdtType = await ccc.Script.fromKnownScript(
    client,
    ccc.KnownScript.XUdt,
    xudtArgs
  );

  const transferTx = ccc.Transaction.from({
    outputs: [{ lock: receiverLockScript, type: xUdtType }],
    outputsData: [ccc.numLeToBytes("10", 16)],
  });
  await transferTx.completeInputsByUdt(signer, xUdtType);

  const balanceDiff =
    (await transferTx.getInputsUdtBalance(signer.client, xUdtType)) -
    transferTx.getOutputsUdtBalance(xUdtType);
  console.log("Balance diff (change):", balanceDiff.toString());
  if (balanceDiff > ccc.Zero) {
    transferTx.addOutput(
      { lock: lockScript, type: xUdtType },
      ccc.numLeToBytes(balanceDiff.toString(), 16)
    );
  }
  await transferTx.addCellDepsOfKnownScripts(signer.client, ccc.KnownScript.XUdt);
  await transferTx.completeInputsByCapacity(signer);
  await transferTx.completeFeeBy(signer, 1000);

  const transferHash = await signer.sendTransaction(transferTx);
  console.log("Transfer TX Hash:", transferHash);

  // Wait for mining
  console.log("Waiting for block...");
  await new Promise(r => setTimeout(r, 6000));

  const transferResult = await client.getTransaction(transferHash);
  console.log("Transfer TX Status:", transferResult?.txStatus?.status);

  console.log("\n=== Verification ===");
  const finalCells = [];
  const finalCollector = client.findCellsByType(typeScriptForQuery, true);
  for await (const cell of finalCollector) {
    finalCells.push(cell);
  }
  console.log("Total token cells after transfer:", finalCells.length);
  for (let i = 0; i < finalCells.length; i++) {
    const cell = finalCells[i];
    console.log(`  Cell ${i}: amount=${ccc.numLeFromBytes(cell.outputData).toString()}, holder=${cell.cellOutput.lock.args}`);
  }

  console.log("\n=== ALL STEPS PASSED ===");
}

main().catch(err => {
  console.error("ERROR:", err.message || err);
  process.exit(1);
});
