import { randomUUID } from 'node:crypto';

export type ConfirmationAction = 'drop_database' | 'drop_user';

export type ConfirmationTask = {
  action: ConfirmationAction;
  target: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
};

export type ConfirmationStore = {
  create(task: { action: ConfirmationAction; target: string }): string;
  consume(token: string): ConfirmationTask | undefined;
};

export function createConfirmationStore(options: { defaultTtlMs: number }): ConfirmationStore {
  const tasks = new Map<string, ConfirmationTask>();

  return {
    create(task) {
      const token = randomUUID();
      const now = Date.now();
      tasks.set(token, {
        action: task.action,
        target: task.target,
        createdAt: now,
        expiresAt: now + options.defaultTtlMs,
        used: false,
      });
      return token;
    },
    consume(token) {
      const task = tasks.get(token);
      if (!task) {
        return undefined;
      }

      if (task.used || task.expiresAt <= Date.now()) {
        tasks.delete(token);
        return undefined;
      }

      task.used = true;
      tasks.delete(token);
      return task;
    },
  };
}
