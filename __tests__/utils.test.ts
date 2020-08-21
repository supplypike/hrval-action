import { yq, yw } from "../src/utils";

test("writes object to yaml", async () => {
  const writeFile = jest.fn();
  await yw("file.yaml", { foo: "bar" }, writeFile);

  expect(writeFile).toHaveBeenCalledWith("file.yaml", `foo: bar\n`);
});

test("reads yaml and returns a value", async () => {
  const readFile = jest.fn().mockResolvedValue(`foo:\n  bar: biz\n`);
  const value = await yq("file.yaml", "foo", readFile);

  expect(readFile).toHaveBeenCalledWith("file.yaml", "utf8");
  expect(value).toEqual({ bar: "biz" });
});
