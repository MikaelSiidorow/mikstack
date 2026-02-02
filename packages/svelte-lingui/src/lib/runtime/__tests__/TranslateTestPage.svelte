<script lang="ts">
	import { setupI18n } from '@lingui/core';
	import { compileMessage } from '@lingui/message-utils/compileMessage';
	import { setI18n } from '../context.svelte';
	import TranslateTest from './TranslateTest.svelte';

	const i18n = setupI18n();
	i18n.setMessagesCompiler(compileMessage);
	i18n.loadAndActivate({ locale: 'en', messages: {} });
	setI18n(i18n);
</script>

<TranslateTest />
