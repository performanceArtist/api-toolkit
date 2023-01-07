export type Behavior<T> = {
  get: () => T;
  set: (value: T) => void;
  subscribe: (callback: (value: T) => void) => { unsubscribe: () => void };
};

const of = <T>(
  initialValue: T,
  onLastUnsub: () => Promise<void> = () => Promise.resolve()
): Behavior<T> => {
  let value = initialValue;
  let callbacks: ((value: T) => void)[] = [];

  const get = () => value;

  const set = (newValue: T) => {
    value = newValue;
    callbacks.forEach((callback) => callback(value));
  };

  const subscribe = (callback: (value: T) => void) => {
    callbacks = callbacks.concat(callback);
    callback(value);

    return {
      unsubscribe: () => {
        callbacks = callbacks.filter((cb) => cb !== callback);
      },
    };
  };

  return { get, set, subscribe };
};

const map =
  <A, B>(f: (value: A) => B) =>
  (b: Behavior<A>): Behavior<B> => {
    const newb = of(f(b.get()));
    b.subscribe((value) => newb.set(f(value)));
    return newb;
  };

function combineT<A, B>(a: Behavior<A>, b: Behavior<B>): Behavior<[A, B]>;
function combineT<A, B, C>(
  a: Behavior<A>,
  b: Behavior<B>,
  c: Behavior<C>
): Behavior<[A, B, C]>;
function combineT<A, B, C, D>(
  a: Behavior<A>,
  b: Behavior<B>,
  c: Behavior<C>,
  d: Behavior<D>
): Behavior<[A, B, C, D]>;
function combineT<A, B, C, D, F>(
  a: Behavior<A>,
  b: Behavior<B>,
  c: Behavior<C>,
  d: Behavior<D>,
  f: Behavior<F>
): Behavior<[A, B, C, D, F]>;
function combineT<A, B, C, D, F, G>(
  a: Behavior<A>,
  b: Behavior<B>,
  c: Behavior<C>,
  d: Behavior<D>,
  f: Behavior<F>,
  g: Behavior<G>
): Behavior<[A, B, C, D, F, G]>;
function combineT(...bs: Behavior<unknown>[]): any {
  const combined = behavior.of(bs.map((b) => b.get()));
  bs.forEach((b) => b.subscribe(() => combined.set(bs.map((b) => b.get()))));

  return combined;
}

const chain =
  <A, B>(f: (value: A) => Behavior<B>) =>
  (fa: Behavior<A>) => {
    const newb: Behavior<B> = behavior.of(f(fa.get()).get());

    fa.subscribe((a) => newb.set(f(a).get()));

    return newb;
  };

export const behavior = { of, map, combineT, chain };
