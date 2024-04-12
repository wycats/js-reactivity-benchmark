import { Cell, Formula, SyncOut } from "@starbeam-lite/core";
import { ReactiveFramework } from "../util/reactiveFramework";

export const starbeamFramework: ReactiveFramework = {
  name: "starbeam",
  signal(initial) {
    const cell = Cell.create(initial);
    return {
      read: () => cell.read(),
      write: (v) => cell.set(v),
    };
  },
  computed: (fn) => {
    const formula = Formula.create(fn);
    return {
      read: () => formula.read(),
    };
  },
  effect: (fn) => {
    const sync = SyncOut(fn);
    BATCHER.effect(sync);
  },
  withBatch: (fn) => {
    fn();
    BATCHER.flush();
  },
  withBuild: (fn) => fn(),
};

// In this benchmark, "batching" means:
//
// 1. run the callback
// 2. flush any pending effects
//
// Starbeam does not have a built-in flushing behavior, but rather leaves
// flushing up to framework integrations, so that frameworks can map them onto
// their own component-scoped flushing (such as `useEffect`).
//
// This is an implementation of an effect flusher that meets the requirements of
// this benchmark harness.
class Effects {
  readonly #effects = new Set<SyncOut>();

  readonly effect = (effect: SyncOut): void => {
    this.#effects.add(effect);
  };

  readonly flush = (): void => {
    for (const effect of this.#effects) {
      effect.poll();
    }
  };
}

let BATCHER = new Effects();
