import { verifyPassword } from "./src/utils/password.js";

async function main() {
  const hash = "$2a$10$wlIUw8KkZBI.SdmfEKztJunZDsAG5FFSMbJp25C0lafOE3UsSafRq";
  const password = "Demo1234!";
  const ok = await verifyPassword("Demo1234!", hash);
  console.log("password check:", ok);
}

main().catch(console.error);