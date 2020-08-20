import * as core from "@actions/core";
import { setupTools } from "./tools";

async function run(): Promise<void> {
  try {
    await setupTools();
    core.debug(`Hello world`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run();
