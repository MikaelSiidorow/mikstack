<script lang="ts">
  import NotePencilIcon from "phosphor-svelte/lib/NotePencilIcon";
  import PaperclipIcon from "phosphor-svelte/lib/PaperclipIcon";
  import PencilSimpleIcon from "phosphor-svelte/lib/PencilSimpleIcon";
  import PlusIcon from "phosphor-svelte/lib/PlusIcon";
  import SignOutIcon from "phosphor-svelte/lib/SignOutIcon";
  import TrashIcon from "phosphor-svelte/lib/TrashIcon";
  import XIcon from "phosphor-svelte/lib/XIcon";
  import Button from "{{uiPrefix}}/Button";
  import FormField from "{{uiPrefix}}/FormField";
  import Input from "{{uiPrefix}}/Input";
  import Separator from "{{uiPrefix}}/Separator";
  import Textarea from "{{uiPrefix}}/Textarea";
  import { createForm } from "@mikstack/form";
  import { dropAllDatabases } from "@rocicorp/zero";
  import * as v from "valibot";
  import { resolve } from "$app/paths";
  import { authClient } from "$lib/auth-client";
  import { get_z } from "$lib/z.svelte";
  import { queries } from "$lib/zero/queries";
  import { mutators } from "$lib/zero/mutators";
  // {{#if:i18n}}
  import { useLingui } from "@mikstack/svelte-lingui";
  import LocaleSwitcher from "$lib/LocaleSwitcher.svelte";
  const { t } = useLingui();
  // {{/if:i18n}}

  let { data } = $props();

  const z = get_z();
  const notesQuery = z.q(queries.note.mine());
  const notes = $derived(notesQuery.data);

  const isMac = $derived(navigator.platform.startsWith("Mac") || navigator.platform === "iPhone");
  const isMobile = $derived(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  const modLabel = $derived(isMac ? "⌘" : "Ctrl");

  function submitOnModEnter(e: KeyboardEvent) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      (e.currentTarget as HTMLFormElement).requestSubmit();
    }
  }

  let editingId = $state<string | null>(null);

  const noteSchema = v.object({
    // {{#if:i18n}}
    title: v.pipe(v.string(), v.minLength(1, t`Title is required`)),
    // {{/if:i18n}}
    // {{#if:!i18n}}
    title: v.pipe(v.string(), v.minLength(1, "Title is required")),
    // {{/if:!i18n}}
    content: v.string(),
  });

  const createNoteForm = createForm({
    schema: noteSchema,
    initialValues: { title: "", content: "" },
    onSubmit(data) {
      z.mutate(
        mutators.note.create({
          id: crypto.randomUUID(),
          title: data.title,
          content: data.content,
        }),
      );
      createNoteForm.reset();
    },
  });

  function startEdit(note: { id: string; title: string; content: string | null }) {
    editingId = note.id;
    editForm.fields.set({
      title: note.title,
      content: note.content ?? "",
    });
  }

  function cancelEdit() {
    editingId = null;
    editForm.reset();
  }

  const editForm = createForm({
    schema: noteSchema,
    initialValues: { title: "", content: "" },
    onSubmit(data) {
      if (!editingId) return;
      z.mutate(
        mutators.note.update({
          id: editingId,
          title: data.title,
          content: data.content,
        }),
      );
      editingId = null;
      editForm.reset();
    },
  });

  function deleteNote(id: string) {
    z.mutate(mutators.note.delete({ id }));
    if (editingId === id) cancelEdit();
  }

  async function signOut() {
    await authClient.signOut();
    await dropAllDatabases();
    window.location.href = resolve("/sign-in");
  }

  // ── Attachments ──

  interface Attachment {
    id: string;
    fileId: string;
    filename: string;
    mimeType: string;
    size: number;
    url: string;
    createdAt: string;
  }

  let attachmentsByNote = $state<Record<string, Attachment[]>>({});
  let uploadingNote = $state<string | null>(null);
  let expandedNote = $state<string | null>(null);

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function loadAttachments(noteId: string) {
    const res = await fetch(resolve(`/api/notes/${noteId}/attachments`));
    if (res.ok) {
      const data = await res.json();
      attachmentsByNote[noteId] = data.attachments;
    }
  }

  function toggleAttachments(noteId: string) {
    if (expandedNote === noteId) {
      expandedNote = null;
    } else {
      expandedNote = noteId;
      loadAttachments(noteId);
    }
  }

  async function uploadFile(noteId: string, file: File) {
    uploadingNote = noteId;
    try {
      // 1. Get presigned upload URL
      const presignRes = await fetch(resolve(`/api/notes/${noteId}/attachments`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "presign",
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
        }),
      });
      if (!presignRes.ok) throw new Error("Failed to get upload URL");
      const { url, key } = await presignRes.json();

      // 2. Upload file directly to S3 via presigned URL
      const uploadRes = await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
      if (!uploadRes.ok) throw new Error("Failed to upload file");

      // 3. Confirm upload to create metadata + link to note
      const confirmRes = await fetch(resolve(`/api/notes/${noteId}/attachments`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          key,
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
        }),
      });
      if (!confirmRes.ok) throw new Error("Failed to confirm upload");

      // 4. Refresh attachment list
      await loadAttachments(noteId);
      expandedNote = noteId;
    } finally {
      uploadingNote = null;
    }
  }

  function handleFileSelect(noteId: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      uploadFile(noteId, file);
      input.value = "";
    }
  }

  async function deleteAttachment(noteId: string, attachmentId: string) {
    const res = await fetch(resolve(`/api/notes/${noteId}/attachments?id=${attachmentId}`), {
      method: "DELETE",
    });
    if (res.ok) {
      await loadAttachments(noteId);
    }
  }
</script>

<div class="container">
  <header class="header">
    <div class="header-title">
      <NotePencilIcon size={24} weight="duotone" />
      <!-- {{#if:i18n}} -->
      <h1>{t`Notes`}</h1>
      <!-- {{/if:i18n}} -->
      <!-- {{#if:!i18n}} -->
      <h1>Notes</h1>
      <!-- {{/if:!i18n}} -->
    </div>
    <div class="header-actions">
      <!-- {{#if:i18n}} -->
      <LocaleSwitcher />
      <!-- {{/if:i18n}} -->
      <span class="email">{data.user.email}</span>
      <Button variant="ghost" onclick={signOut}>
        <!-- {{#if:i18n}} -->
        <SignOutIcon size={16} weight="bold" /> {t`Sign out`}
        <!-- {{/if:i18n}} -->
        <!-- {{#if:!i18n}} -->
        <SignOutIcon size={16} weight="bold" /> Sign out
        <!-- {{/if:!i18n}} -->
      </Button>
    </div>
  </header>

  <Separator />

  <section>
    <!-- {{#if:i18n}} -->
    <h2>{t`New note`}</h2>
    <!-- {{/if:i18n}} -->
    <!-- {{#if:!i18n}} -->
    <h2>New note</h2>
    <!-- {{/if:!i18n}} -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <form id={createNoteForm.id} onsubmit={createNoteForm.onsubmit} onkeydown={submitOnModEnter} class="note-form">
      <FormField for={createNoteForm.fields.title.as("text").id}>
        {#snippet label(attrs)}
          <!-- {{#if:i18n}} -->
          <label {...attrs}>{t`Title`}</label>
          <!-- {{/if:i18n}} -->
          <!-- {{#if:!i18n}} -->
          <label {...attrs}>Title</label>
          <!-- {{/if:!i18n}} -->
        {/snippet}
        <!-- {{#if:i18n}} -->
        <Input {...createNoteForm.fields.title.as("text")} placeholder={t`Note title`} />
        <!-- {{/if:i18n}} -->
        <!-- {{#if:!i18n}} -->
        <Input {...createNoteForm.fields.title.as("text")} placeholder="Note title" />
        <!-- {{/if:!i18n}} -->
        {#snippet error(attrs)}
          {#each createNoteForm.fields.title.issues() as issue (issue.message)}
            <p {...attrs}>{issue.message}</p>
          {/each}
        {/snippet}
      </FormField>

      <FormField for={`${createNoteForm.id}-content`}>
        {#snippet label(attrs)}
          <!-- {{#if:i18n}} -->
          <label {...attrs}>{t`Content`}</label>
          <!-- {{/if:i18n}} -->
          <!-- {{#if:!i18n}} -->
          <label {...attrs}>Content</label>
          <!-- {{/if:!i18n}} -->
        {/snippet}
        <!-- {{#if:i18n}} -->
        <Textarea
          name={createNoteForm.fields.content.name()}
          id="{createNoteForm.id}-content"
          oninput={(e) =>
            createNoteForm.fields.content.set((e.target as HTMLTextAreaElement).value)}
          value={createNoteForm.fields.content.value() as string}
          placeholder={t`Write something...`}
        />
        <!-- {{/if:i18n}} -->
        <!-- {{#if:!i18n}} -->
        <Textarea
          name={createNoteForm.fields.content.name()}
          id="{createNoteForm.id}-content"
          oninput={(e) =>
            createNoteForm.fields.content.set((e.target as HTMLTextAreaElement).value)}
          value={createNoteForm.fields.content.value() as string}
          placeholder="Write something..."
        />
        <!-- {{/if:!i18n}} -->
      </FormField>

      {#if createNoteForm.error}
        <p class="form-error">{createNoteForm.error}</p>
      {/if}

      <Button type="submit" disabled={createNoteForm.pending}>
        <PlusIcon size={16} weight="bold" />
        <!-- {{#if:i18n}} -->
        {createNoteForm.pending ? t`Creating...` : t`Create note`}
        <!-- {{/if:i18n}} -->
        <!-- {{#if:!i18n}} -->
        {createNoteForm.pending ? "Creating..." : "Create note"}
        <!-- {{/if:!i18n}} -->
        {#if !isMobile}<kbd>{modLabel}+Enter</kbd>{/if}
      </Button>
    </form>
  </section>

  <Separator />

  <section>
    <!-- {{#if:i18n}} -->
    <h2>{t`Your notes`}</h2>
    <!-- {{/if:i18n}} -->
    <!-- {{#if:!i18n}} -->
    <h2>Your notes</h2>
    <!-- {{/if:!i18n}} -->
    {#if notes.length === 0}
      <!-- {{#if:i18n}} -->
      <p class="empty">{t`No notes yet. Create one above!`}</p>
      <!-- {{/if:i18n}} -->
      <!-- {{#if:!i18n}} -->
      <p class="empty">No notes yet. Create one above!</p>
      <!-- {{/if:!i18n}} -->
    {:else}
      <ul class="note-list">
        {#each notes as note (note.id)}
          <li class="note-card">
            {#if editingId === note.id}
              <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
              <form id={editForm.id} onsubmit={editForm.onsubmit} onkeydown={submitOnModEnter} class="note-form">
                <FormField for={editForm.fields.title.as("text").id}>
                  {#snippet label(attrs)}
                    <!-- {{#if:i18n}} -->
                    <label {...attrs}>{t`Title`}</label>
                    <!-- {{/if:i18n}} -->
                    <!-- {{#if:!i18n}} -->
                    <label {...attrs}>Title</label>
                    <!-- {{/if:!i18n}} -->
                  {/snippet}
                  <Input {...editForm.fields.title.as("text")} />
                  {#snippet error(attrs)}
                    {#each editForm.fields.title.issues() as issue (issue.message)}
                      <p {...attrs}>{issue.message}</p>
                    {/each}
                  {/snippet}
                </FormField>

                <FormField for={`${editForm.id}-content`}>
                  {#snippet label(attrs)}
                    <!-- {{#if:i18n}} -->
                    <label {...attrs}>{t`Content`}</label>
                    <!-- {{/if:i18n}} -->
                    <!-- {{#if:!i18n}} -->
                    <label {...attrs}>Content</label>
                    <!-- {{/if:!i18n}} -->
                  {/snippet}
                  <Textarea
                    name={editForm.fields.content.name()}
                    id="{editForm.id}-content"
                    oninput={(e) =>
                      editForm.fields.content.set((e.target as HTMLTextAreaElement).value)}
                    value={editForm.fields.content.value() as string}
                    autofocus
                  />
                </FormField>

                {#if editForm.error}
                  <p class="form-error">{editForm.error}</p>
                {/if}

                <div class="actions">
                  <Button type="submit" disabled={editForm.pending}>
                    <!-- {{#if:i18n}} -->
                    {editForm.pending ? t`Saving...` : t`Save`}
                    <!-- {{/if:i18n}} -->
                    <!-- {{#if:!i18n}} -->
                    {editForm.pending ? "Saving..." : "Save"}
                    <!-- {{/if:!i18n}} -->
                    {#if !isMobile}<kbd>{modLabel}+Enter</kbd>{/if}
                  </Button>
                  <Button variant="ghost" type="button" onclick={cancelEdit}>
                    <!-- {{#if:i18n}} -->
                    <XIcon size={16} weight="bold" /> {t`Cancel`}
                    <!-- {{/if:i18n}} -->
                    <!-- {{#if:!i18n}} -->
                    <XIcon size={16} weight="bold" /> Cancel
                    <!-- {{/if:!i18n}} -->
                  </Button>
                </div>
              </form>
            {:else}
              <div class="note-body">
                <strong>{note.title}</strong>
                {#if note.content}
                  <p class="note-text">{note.content}</p>
                {/if}
              </div>
              <div class="actions">
                <Button variant="ghost" onclick={() => startEdit(note)}>
                  <!-- {{#if:i18n}} -->
                  <PencilSimpleIcon size={16} /> {t`Edit`}
                  <!-- {{/if:i18n}} -->
                  <!-- {{#if:!i18n}} -->
                  <PencilSimpleIcon size={16} /> Edit
                  <!-- {{/if:!i18n}} -->
                </Button>
                <label class="attach-btn">
                  <input
                    type="file"
                    hidden
                    onchange={(e) => handleFileSelect(note.id, e)}
                    disabled={uploadingNote === note.id}
                  />
                  <Button variant="ghost" type="button" disabled={uploadingNote === note.id} onclick={(e: MouseEvent) => {
                    const label = (e.currentTarget as HTMLElement).closest('label');
                    label?.querySelector('input')?.click();
                    e.preventDefault();
                  }}>
                    <PaperclipIcon size={16} />
                    <!-- {{#if:i18n}} -->
                    {uploadingNote === note.id ? t`Uploading...` : t`Attach`}
                    <!-- {{/if:i18n}} -->
                    <!-- {{#if:!i18n}} -->
                    {uploadingNote === note.id ? "Uploading..." : "Attach"}
                    <!-- {{/if:!i18n}} -->
                  </Button>
                </label>
                <Button variant="ghost" onclick={() => toggleAttachments(note.id)}>
                  <!-- {{#if:i18n}} -->
                  {expandedNote === note.id ? t`Hide files` : t`Files`}
                  <!-- {{/if:i18n}} -->
                  <!-- {{#if:!i18n}} -->
                  {expandedNote === note.id ? "Hide files" : "Files"}
                  <!-- {{/if:!i18n}} -->
                </Button>
                <Button variant="danger" onclick={() => deleteNote(note.id)}>
                  <!-- {{#if:i18n}} -->
                  <TrashIcon size={16} /> {t`Delete`}
                  <!-- {{/if:i18n}} -->
                  <!-- {{#if:!i18n}} -->
                  <TrashIcon size={16} /> Delete
                  <!-- {{/if:!i18n}} -->
                </Button>
              </div>
              {#if expandedNote === note.id}
                <div class="attachments">
                  {#if !attachmentsByNote[note.id] || attachmentsByNote[note.id].length === 0}
                    <!-- {{#if:i18n}} -->
                    <p class="empty">{t`No attachments yet.`}</p>
                    <!-- {{/if:i18n}} -->
                    <!-- {{#if:!i18n}} -->
                    <p class="empty">No attachments yet.</p>
                    <!-- {{/if:!i18n}} -->
                  {:else}
                    <ul class="attachment-list">
                      {#each attachmentsByNote[note.id] as attachment (attachment.id)}
                        <li class="attachment-item">
                          <a href={attachment.url} target="_blank" rel="noopener noreferrer" class="attachment-link">
                            <PaperclipIcon size={14} />
                            <span class="attachment-name">{attachment.filename}</span>
                            <span class="attachment-size">{formatFileSize(attachment.size)}</span>
                          </a>
                          <button
                            class="attachment-delete"
                            onclick={() => deleteAttachment(note.id, attachment.id)}
                          >
                            <XIcon size={14} />
                          </button>
                        </li>
                      {/each}
                    </ul>
                  {/if}
                </div>
              {/if}
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</div>

<style>
  .container {
    max-width: 40rem;
    margin: 0 auto;
    padding: var(--space-5) var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--space-3);
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: var(--space-2);

    & h1 {
      font-size: var(--text-2xl);
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .email {
    font-size: var(--text-sm);
    color: var(--text-2);
  }

  h2 {
    font-size: var(--text-lg);
    margin-bottom: var(--space-3);
  }

  .note-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .form-error {
    font-size: var(--text-sm);
    color: var(--danger);
  }

  .note-list {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .note-card {
    padding: var(--space-4);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    background-color: var(--surface-2);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .note-body {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .note-text {
    color: var(--text-2);
    font-size: var(--text-sm);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .actions {
    display: flex;
    gap: var(--space-2);
  }

  .attach-btn {
    display: contents;
  }

  .empty {
    color: var(--text-2);
    font-size: var(--text-sm);
  }

  .attachments {
    border-top: 1px solid var(--border);
    padding-top: var(--space-3);
  }

  .attachment-list {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .attachment-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
    background-color: var(--surface-1);
    font-size: var(--text-sm);
  }

  .attachment-link {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: inherit;
    text-decoration: none;
    min-width: 0;

    &:hover {
      text-decoration: underline;
    }
  }

  .attachment-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .attachment-size {
    color: var(--text-2);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .attachment-delete {
    all: unset;
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: var(--space-1);
    border-radius: var(--radius-sm);
    color: var(--text-2);
    flex-shrink: 0;

    &:hover {
      color: var(--danger);
      background-color: var(--surface-2);
    }
  }
</style>
