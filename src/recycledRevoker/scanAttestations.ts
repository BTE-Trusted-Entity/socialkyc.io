import { CType, Did } from "@kiltprotocol/sdk-js";

import { Attestation as AttestationModel } from "./models/attestation";

import { subScanEventGenerator } from "./subScan";
import { logger } from "./logger";

export type EventParams = [
  { type_name: "AttesterOf"; value: `0x${string}` },
  { type_name: "ClaimHashOf"; value: `0x${string}` },
  { type_name: "CTypeHashOf"; value: `0x${string}` },
  { type_name: "DelegationNodeIdOf"; value: `0x${string}` | null }
];

export async function scanAttestations() {
  const latestAttestation = await AttestationModel.findOne({
    order: [["createdAt", "DESC"]],
  });
  const fromBlock = latestAttestation
    ? Number(latestAttestation.dataValues.block)
    : 0;

  const eventGenerator = subScanEventGenerator(
    "attestation",
    "AttestationCreated",
    fromBlock
  );

  for await (const event of eventGenerator) {
    const { block, blockTimestampMs, params, extrinsicHash } = event;
    const createdAt = new Date(blockTimestampMs);

    const owner = Did.fromChain(params[0].value);
    const claimHash = params[1].value;
    const cTypeId = CType.hashToId(params[2].value);
    const delegationId = params[3].value;

    try {
      await AttestationModel.upsert({
        claimHash,
        cTypeId,
        owner,
        delegationId,
        createdAt,
        extrinsicHash,
        block: String(block),
      });
    } catch (exception) {
      if (
        exception &&
        (exception as Error).name === "SequelizeForeignKeyConstraintError"
      ) {
        // Likely a broken CType which we haven’t saved to the database
        logger.debug(`Ignoring attestation ${claimHash} for unknown CType`);
        continue;
      }
      throw exception;
    }
  }
}
