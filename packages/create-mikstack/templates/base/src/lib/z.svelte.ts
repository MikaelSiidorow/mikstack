import type { Z } from "zero-svelte";
import type { Schema } from "./zero/schema";
import { getContext, setContext } from "svelte";

const zSymbol = Symbol("z");

export function set_z(z: Z<Schema>) {
  setContext(zSymbol, z);
  return z;
}

export function get_z() {
  return getContext(zSymbol) as Z<Schema>;
}
