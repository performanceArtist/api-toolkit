import { pipe } from "./utils";

export type Pending = {
  type: "pending";
};
const pending: Pending = {
  type: "pending",
};

export const isPending = (data: any): data is Pending =>
  data.type === "pending";

export type Initial = {
  type: "initial";
};
const initial: Initial = {
  type: "initial",
};
export const isInitial = (data: any): data is Initial =>
  data.type === "initial";

export type RemoteDataError<E> = {
  type: "error";
  error: unknown;
};

export type Success<T> = {
  type: "success";
  data: T;
};

export type RemoteData<E, T> =
  | Success<T>
  | RemoteDataError<E>
  | Pending
  | Initial;

const map =
  <A, B>(f: (a: A) => B) =>
  <E>(d: RemoteData<E, A>): RemoteData<E, B> =>
    d.type === "success" ? { type: "success", data: f(d.data) } : d;

const mapLeft =
  <E, B>(f: (a: E) => B) =>
  <T>(d: RemoteData<E, T>): RemoteData<B, T> =>
    d.type === "error" ? { type: "error", error: f(d.error as any) } : d;

const ap = <E, A, B>(fb: RemoteData<E, (a: A) => B>, fa: RemoteData<E, A>) =>
  fb.type === "success" && fa.type === "success"
    ? remoteData.makeSuccess(fb.data(fa.data))
    : (fb as RemoteData<E, B>);

function combineT<E, A, B>(
  a: RemoteData<E, A>,
  b: RemoteData<E, B>
): RemoteData<E, [A, B]>;
function combineT<E, A, B, C>(
  a: RemoteData<E, A>,
  b: RemoteData<E, B>,
  c: RemoteData<E, C>
): RemoteData<E, [A, B, C]>;
function combineT<E, A, B, C, D>(
  a: RemoteData<E, A>,
  b: RemoteData<E, B>,
  c: RemoteData<E, C>,
  d: RemoteData<E, D>
): RemoteData<E, [A, B, C, D]>;
function combineT<E, A, B, C, D, F>(
  a: RemoteData<E, A>,
  b: RemoteData<E, B>,
  c: RemoteData<E, C>,
  d: RemoteData<E, D>,
  f: RemoteData<E, F>
): RemoteData<E, [A, B, C, D, F]>;
function combineT<E, A, B, C, D, F, G>(
  a: RemoteData<E, A>,
  b: RemoteData<E, B>,
  c: RemoteData<E, C>,
  d: RemoteData<E, D>,
  f: RemoteData<E, F>,
  g: RemoteData<E, G>
): RemoteData<E, [A, B, C, D, F, G]>;
function combineT(...rds: RemoteData<unknown, unknown>[]) {
  return rds.reduce((acc: RemoteData<unknown, unknown[]>, cur) => {
    const concat = pipe(
      cur,
      map((next) => (rest: unknown[]) => rest.concat(next))
    );

    return ap(concat, acc);
  }, remoteData.makeSuccess([]));
}

const chain =
  <A, B, NE>(f: (a: A) => RemoteData<NE, B>) =>
  <E>(d: RemoteData<E, A>): RemoteData<NE | E, B> =>
    d.type === "success" ? f(d.data) : d;

const fold =
  <E, T, A>(
    onInitial: () => A,
    onPending: () => A,
    onError: (e: E) => A,
    onSuccess: (data: T) => A
  ) =>
  (rd: RemoteData<E, T>): A => {
    switch (rd.type) {
      case "initial":
        return onInitial();
      case "pending":
        return onPending();
      case "error":
        return onError(rd.error as any);
      case "success":
        return onSuccess(rd.data);
    }
  };

const getOrElse =
  <A>(def: A) =>
  <E>(rd: RemoteData<E, A>): A =>
    rd.type === "success" ? rd.data : def;

const exists =
  <A>(predicate: (value: A) => boolean) =>
  <E>(rd: RemoteData<E, A>) =>
    rd.type === "success" && predicate(rd.data);

const getOrElseN =
  <E, A>(getDefault: () => A) =>
  (rd: RemoteData<E, A>): A =>
    rd.type === "success" ? rd.data : getDefault();

export const remoteData = {
  initial,
  pending,
  makeError: <E>(error: E): RemoteDataError<E> => ({ type: "error", error }),
  makeSuccess: <T>(data: T): Success<T> => ({ type: "success", data }),
  map,
  mapLeft,
  combineT,
  chain,
  fold,
  getOrElse,
  getOrElseN,
  exists,
};
