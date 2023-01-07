import { pipe } from "./utils";
import { RemoteData, remoteData } from "./RemoteData";
import { Behavior, behavior } from "./Behavior";

export type BehaviorRemoteData<E, A> = Behavior<RemoteData<E, A>>;

export const map =
  <A, B>(f: (a: A) => B) =>
  <E>(b: BehaviorRemoteData<E, A>): BehaviorRemoteData<E, B> =>
    pipe(b, behavior.map(remoteData.map(f)));

function combineT<E, A, B>(
  a: BehaviorRemoteData<E, A>,
  b: BehaviorRemoteData<E, B>
): BehaviorRemoteData<E, [A, B]>;
function combineT<E, A, B, C>(
  a: BehaviorRemoteData<E, A>,
  b: BehaviorRemoteData<E, B>,
  c: BehaviorRemoteData<E, C>
): BehaviorRemoteData<E, [A, B, C]>;
function combineT<E, A, B, C, D>(
  a: BehaviorRemoteData<E, A>,
  b: BehaviorRemoteData<E, B>,
  c: BehaviorRemoteData<E, C>,
  d: BehaviorRemoteData<E, D>
): BehaviorRemoteData<E, [A, B, C, D]>;
function combineT<E, A, B, C, D, F>(
  a: BehaviorRemoteData<E, A>,
  b: BehaviorRemoteData<E, B>,
  c: BehaviorRemoteData<E, C>,
  d: BehaviorRemoteData<E, D>,
  f: BehaviorRemoteData<E, F>
): BehaviorRemoteData<E, [A, B, C, D, F]>;
function combineT<E, A, B, C, D, F, G>(
  a: BehaviorRemoteData<E, A>,
  b: BehaviorRemoteData<E, B>,
  c: BehaviorRemoteData<E, C>,
  d: BehaviorRemoteData<E, D>,
  f: BehaviorRemoteData<E, F>,
  g: BehaviorRemoteData<E, G>
): BehaviorRemoteData<E, [A, B, C, D, F, G]>;
function combineT(...rdbs: BehaviorRemoteData<unknown, unknown>[]): any {
  return pipe(
    behavior.combineT.apply(null, rdbs as any),
    behavior.map(remoteData.combineT as any)
  ) as BehaviorRemoteData<unknown, unknown[]>;
}

const chain =
  <E, A, B>(f: (value: A) => BehaviorRemoteData<E, B>) =>
  (fa: BehaviorRemoteData<E, A>) =>
    pipe(
      fa,
      behavior.chain((rd) => {
        if (rd.type === "success") {
          return f(rd.data);
        } else {
          const nb = behavior.of(rd) as BehaviorRemoteData<E, B>;
          return nb;
        }
      })
    );

export const behaviorRemoteData = { map, combineT, chain };
