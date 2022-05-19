import { IDE } from './ide/ide';

export const ide = new IDE();
ide.startConnecting();
ide.tryCompile();