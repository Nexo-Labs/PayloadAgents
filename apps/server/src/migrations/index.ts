import * as migration_20260129_000559 from './20260129_000559';
import * as migration_20260131_150517 from './20260131_150517';

export const migrations = [
  {
    up: migration_20260129_000559.up,
    down: migration_20260129_000559.down,
    name: '20260129_000559',
  },
  {
    up: migration_20260131_150517.up,
    down: migration_20260131_150517.down,
    name: '20260131_150517'
  },
];
