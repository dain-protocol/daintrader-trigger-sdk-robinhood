import { RobinhoodCrypto } from "npm:robinhood-crypto@0.0.8";
import bs58 from "npm:bs58";

import { loadEnv } from "./env.ts";
const env = await loadEnv();



export const robinhood = new RobinhoodCrypto({
  apiKey: env("EXTRA_API_KEY") as string,
  privateKeyBase64: globalThis.btoa(
    String.fromCharCode(
      ...bs58.decode(env("TRIGGER_ADDRESS_PRIVATE_KEY") as string)
    )
  ),
  publicKeyBase64: globalThis.btoa(
    String.fromCharCode(...bs58.decode(env("TRIGGER_ADDRESS") as string))
  ),
});
