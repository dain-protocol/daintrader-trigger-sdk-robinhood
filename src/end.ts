import fetcher from "./util/signFetch.ts";
import { loadEnv } from "./util/env.ts";

const env = await loadEnv();
const address = env("TRIGGER_ADDRESS") as string;

const ownerAddress = env("OWNER_ADDRESS") as string;

export async function end() {
  console.log("ending and redepositing into main account");

  // end the trigger agent

  const url = `${env("API_URL")}/autonomy-sdk-api/common/end`;
  const { success } = await fetcher<{
    success: boolean;
  }>(url, {
    method: "GET",
  });

  if (!success) throw new Error("Failed to end trigger agent");

  console.log("end complete");
}
