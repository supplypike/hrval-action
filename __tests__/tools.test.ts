import { setupTools } from "../src/tools";
import os from "os";

test("test runs", async () => {
  process.env.RUNNER_TOOL_CACHE = os.tmpdir();
  process.env.RUNNER_TEMP = "/tmp";
  await setupTools();
});
