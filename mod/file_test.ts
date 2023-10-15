import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { Tree } from "./file.ts";

Deno.test("Tree test", () => {
  const tree = new Tree();
  tree.setSibling("a");
  tree.setSibling("b");
  tree.setSibling("c");
  const actual = tree.getSibling(tree.root);
  const expected = ["a", "b", "c"];
  assertEquals(actual, expected);
});
