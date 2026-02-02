import { useLingui, msg } from '@mikstack/svelte-lingui';

const { t, plural, select } = useLingui();

// Tagged templates
const simple = t`Hello`;
const interpolated = t`Hello ${name}`;

// Predefined messages
const greeting = msg`Welcome`;
const farewell = msg({ message: 'Goodbye', context: 'formal' });

// Plural
const items = plural(count, { one: '# item', other: '# items' });

// Select
const pronoun = select(gender, { male: 'He', female: 'She', other: 'They' });

// Descriptor
const thanks = t({ message: 'Thank you' });
