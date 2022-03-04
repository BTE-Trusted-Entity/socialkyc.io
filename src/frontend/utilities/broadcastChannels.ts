const input = 'EXTENSION_INPUT';
const output = 'EXTENSION_OUTPUT';

export const extensionInput = new BroadcastChannel(input);

export const extensionOutput = new BroadcastChannel(output);
