<script lang="ts">
  import type { Snippet } from "svelte";
  import type { LayoutData } from "./$types";
  import { Z } from "zero-svelte";
  import { PUBLIC_SERVER } from "$env/static/public";
  import { schema } from "$lib/zero/schema";
  import { mutators } from "$lib/zero/mutators";
  import { set_z } from "$lib/z.svelte";

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  set_z(
    new Z({
      get userID() {
        return data.user.id;
      },
      server: PUBLIC_SERVER,
      schema,
      mutators,
      kvStore: "idb",
      context: {
        get userID() {
          return data.user.id;
        },
      },
    }),
  );
</script>

{@render children()}
