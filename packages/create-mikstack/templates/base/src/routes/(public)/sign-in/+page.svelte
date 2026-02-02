<script lang="ts">
  import EnvelopeSimpleIcon from "phosphor-svelte/lib/EnvelopeSimpleIcon";
  import CheckCircleIcon from "phosphor-svelte/lib/CheckCircleIcon";
  import Button from "{{uiPrefix}}/Button";
  import FormField from "{{uiPrefix}}/FormField";
  import Input from "{{uiPrefix}}/Input";
  import { createForm } from "@mikstack/form";
  import * as v from "valibot";
  import { authClient } from "$lib/auth-client";
  // {{#if:i18n}}
  import { useLingui } from "@mikstack/svelte-lingui";
  import LocaleSwitcher from "$lib/LocaleSwitcher.svelte";
  const { t } = useLingui();
  // {{/if:i18n}}

  const form = createForm({
    schema: v.object({
      // {{#if:i18n}}
      email: v.pipe(v.string(), v.email(t`Please enter a valid email address`)),
      // {{/if:i18n}}
      // {{#if:!i18n}}
      email: v.pipe(v.string(), v.email("Please enter a valid email address")),
      // {{/if:!i18n}}
    }),
    initialValues: { email: "" },
    async onSubmit(data) {
      const { error } = await authClient.signIn.magicLink({
        email: data.email,
        callbackURL: "/",
      });
      if (error) throw new Error(error.message ?? "Failed to send magic link");
      return { sent: true };
    },
  });

  const emailField = form.fields.email;
</script>

<div class="sign-in">
  <!-- {{#if:i18n}} -->
  <div class="locale-bar">
    <LocaleSwitcher />
  </div>
  <h1>{t`Sign in to {{projectName}}`}</h1>
  <!-- {{/if:i18n}} -->
  <!-- {{#if:!i18n}} -->
  <h1>Sign in to {{projectName}}</h1>
  <!-- {{/if:!i18n}} -->

  {#if form.result}
    <div class="success">
      <CheckCircleIcon size={24} weight="duotone" />
      <!-- {{#if:i18n}} -->
      <p>{t`Check your email for a magic link to sign in.`}</p>
      <!-- {{/if:i18n}} -->
      <!-- {{#if:!i18n}} -->
      <p>Check your email for a magic link to sign in.</p>
      <!-- {{/if:!i18n}} -->
    </div>
  {:else}
    <form id={form.id} onsubmit={form.onsubmit} class="sign-in-form">
      <FormField for={emailField.as("email").id}>
        {#snippet label(attrs)}
          <!-- {{#if:i18n}} -->
          <label {...attrs}>{t`Email`}</label>
          <!-- {{/if:i18n}} -->
          <!-- {{#if:!i18n}} -->
          <label {...attrs}>Email</label>
          <!-- {{/if:!i18n}} -->
        {/snippet}
        <Input {...emailField.as("email")} placeholder="you@example.com" />
        {#snippet error(attrs)}
          {#each emailField.issues() as issue (issue.message)}
            <p {...attrs}>{issue.message}</p>
          {/each}
        {/snippet}
      </FormField>

      {#if form.error}
        <p class="form-error">{form.error}</p>
      {/if}

      <Button type="submit" disabled={form.pending}>
        <EnvelopeSimpleIcon size={16} weight="bold" />
        <!-- {{#if:i18n}} -->
        {form.pending ? t`Sending magic link...` : t`Sign in with magic link`}
        <!-- {{/if:i18n}} -->
        <!-- {{#if:!i18n}} -->
        {form.pending ? "Sending magic link..." : "Sign in with magic link"}
        <!-- {{/if:!i18n}} -->
      </Button>
    </form>
  {/if}
</div>

<style>
  .sign-in {
    max-width: 24rem;
    margin: 0 auto;
    padding: var(--space-8) var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  .locale-bar {
    display: flex;
    justify-content: flex-end;
  }

  h1 {
    font-size: var(--text-2xl);
  }

  .sign-in-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .form-error {
    font-size: var(--text-sm);
    color: var(--danger);
  }

  .success {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-4);
    border-radius: var(--radius-md);
    background-color: var(--surface-2);
    color: var(--text-1);
  }
</style>
