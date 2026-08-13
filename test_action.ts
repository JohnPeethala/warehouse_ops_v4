import { getDriverMatrixData } from "./src/app/actions/teamFleet";

async function test() {
  console.log("Fetching...");
  try {
    const res = await getDriverMatrixData("2026-08");
    console.log("Result:", JSON.stringify(res, null, 2));
  } catch (e) {
    console.error("Caught error:", e);
  }
}

test();
