import type { Character } from '../../core/Character';
export interface ICommand { readonly id: string; readonly label: string; readonly actor: Character; readonly target: Character; readonly timestamp: string; execute(): boolean; undo(): void; }
