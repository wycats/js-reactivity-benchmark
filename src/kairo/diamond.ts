import { Counter } from "../util/dependencyGraph";
import { Computed, ReactiveFramework } from "../util/reactiveFramework";

let width = 5;

export function diamond(bridge: ReactiveFramework) {
  // make a state signal
  let head = bridge.signal(0);
  // make an array of computeds
  let current: Computed<number>[] = [];

  // populate the array of computeds -- each computed increments the head signal
  // by 1.
  for (let i = 0; i < width; i++) {
    current.push(
      bridge.computed(() => {
        return head.read() + 1;
      })
    );
  }

  // the sum computed loops over the computeds and accumulates their values
  let sum = bridge.computed(() => {
    return current.map((x) => x.read()).reduce((a, b) => a + b, 0);
  });

  // Counter is a non-reactive data structure with a mutable `count` property
  // that can be incremented.
  let callCounter = new Counter();

  // this effect reads from the `sum` computed to make it a dependency and
  // increments `callCounter`, effectively making it a reactive sink.
  bridge.effect(() => {
    sum.read();
    callCounter.count++;
  });

  return () => {
    // write the head signal to 1 in a batch
    bridge.withBatch(() => {
      head.write(1);
    });

    // since the head is 1, each of the computeds is now 2, so the sum is
    // `2*width`.
    console.assert(sum.read() === 2 * width);
    const atleast = 500;
    callCounter.count = 0;

    // do this 500 times
    for (let i = 0; i < 500; i++) {
      // write the head signal to i in a batch
      bridge.withBatch(() => {
        head.write(i);
      });

      // same as above: since the head is i, each of the computeds is now
      // (i+1), so the sum is (i+1)*width
      console.assert(sum.read() === (i + 1) * width);
    }

    // verify that `callCounter` was incremented `atleast` times
    console.assert(callCounter.count === atleast);
  };
}
