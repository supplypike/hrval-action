import * as tc from "@actions/tool-cache";
import * as core from "@actions/core";
import * as exec from "@actions/exec";

const KUBEVAL_VER = "0.15.0";

export async function setupTools() {
  await setupKubeval();
}

async function setupKubeval() {
  let cachedPath = tc.find("kubeval", KUBEVAL_VER, "x64");
  if (cachedPath) {
    core.addPath(cachedPath);
    return;
  }

  const tar = await tc.downloadTool(
    `https://github.com/instrumenta/kubeval/releases/tag/${KUBEVAL_VER}`
  );
  const path = await tc.extractTar(tar, "/kubeval");
  cachedPath = await tc.cacheDir(path, "kubeval", KUBEVAL_VER, "x64");

  core.addPath(cachedPath);
}

export async function kubeval(...args: string[]) {
  await exec.exec("kubeval", args);
}

export async function helm(...args: string[]) {
  await exec.exec("kubeval", args);
}
