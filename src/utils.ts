import { readFile, writeFile, stat } from "fs/promises";
import yaml from "js-yaml";
import { get as _get } from "lodash";

export async function isFile(path: string) {
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
  path: string
): Promise<string | undefined> {
  const doc = yaml.safeLoad(await readFile(file, "utf8"));

  if (typeof doc === "object") {
    return _get(doc, path)?.toString();
  }

  return undefined;
}

/**
 * YAML Writer
 *
 * @example
 * ```ts
 *  await yw("/path/to/file.yaml", someObject)
 * ```
 */
export async function yw(file: string, content: JSON): Promise<void> {
  const doc = yaml.safeDump(content);

  await writeFile(file, doc);
}
