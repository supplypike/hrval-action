import { exec } from "@actions/exec";
import { promises as fs } from "fs";
import yaml from "js-yaml";
import { get as _get } from "lodash";

const { readFile, writeFile, stat } = fs;

export async function isFile(path: string): Promise<boolean> {
  const stats = await stat(path);
  return stats.isFile();
}

/**
 * YAML Parser
 *
 * @example
 * ```ts
 *  await yq("/path/to/file.yaml", "spec.chart.path")
 * ```
 */
export async function yq(
  file: string,
  path: string,
  read = readFile
): Promise<unknown> {
  const doc = yaml.safeLoad(await read(file, "utf8"));

  return _get(doc, path);
}

/**
 * YAML Writer
 *
 * @example
 * ```ts
 *  await yw("/path/to/file.yaml", someObject)
 * ```
 */
export async function yw(
  file: string,
  content: Record<string, unknown>,
  write = writeFile
): Promise<void> {
  const doc = yaml.safeDump(content);
  await write(file, doc);
}

export async function execWithOutput(
  cmd: string,
  args: string[]
): Promise<string> {
  let output = "";
  let error = "";
  const options = {
    listeners: {
      stdout: (data: Buffer) => {
        output += data.toString();
      },
      stderr: (data: Buffer) => {
        error += data.toString();
      },
    },
  };

  await exec(cmd, args, options);
  if (error) {
    throw new Error(error);
  }

  return output;
}
