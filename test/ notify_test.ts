import { assertEquals } from "jsr:@std/assert";

import { sendNotification } from "../src/notifications.ts";
import { loadEnv } from "../src/util/env.ts";
import { Keypair } from "https://esm.sh/@solana/web3.js@1.91.8";
import bs58 from "npm:bs58";
const env = await loadEnv();

Deno.test("is proper keypair", () => {
  const privateKey = env("TRIGGER_ADDRESS_PRIVATE_KEY");
  const publicKey = env("TRIGGER_ADDRESS");

  const keypair = Keypair.fromSecretKey(
    new Uint8Array(bs58.decode(privateKey as string))
  );

  console.log(keypair.publicKey.toBase58());
  assertEquals(keypair.publicKey.toBase58(), publicKey, "public key is not set");
  
});
Deno.test("sendNotification", async () => {
  const val = await sendNotification("telegram", "Hi !! test-");

  // asset is treue

  assertEquals(val, true, "sendNotification failed");
});
