import { flow, pipe } from "./utils";
import { remoteData, RemoteData } from "./RemoteData";
import { Behavior, behavior } from "./Behavior";
import { RemoteDataCached } from "./RemoteDataCached";
import { defaultSerializeQueryArgs } from "./serialize";

type AsyncRequest = (query: any) => Promise<unknown>;

export type BehaviorRemoteDataCached<E, A> = Behavior<RemoteDataCached<E, A>>;

type CacheEntry = {
  latestState: RemoteDataCached<unknown, unknown>;
  work: null | Promise<RemoteData<unknown, unknown>>;
  query: Record<any, any>;
  key: PropertyKey;
  tags: unknown[];
};

type ToQueryResult<T> = T extends Promise<RemoteData<infer E, infer A>>
  ? Behavior<RemoteDataCached<E, A>>
  : never;

type ToMutationResult<T> = T extends Promise<RemoteData<infer E, infer A>>
  ? Behavior<RemoteData<E, A>>
  : never;

type FromPromiseToRD<E, T> = T extends Promise<infer A>
  ? RemoteData<E, A>
  : never;

type FromPromiseFunctionToRD<E, T> = T extends (
  ...args: infer Q
) => Promise<infer A>
  ? (...args: Q) => Promise<RemoteData<E, A>>
  : never;

export const fromPromise =
  <E>(toError: (input: unknown) => E) =>
  <A>(p: Promise<A>): Promise<RemoteData<E, A>> =>
    p.then(remoteData.makeSuccess).catch(flow(toError, remoteData.makeError));

export const makeApi = <
  E,
  Tag extends readonly string[],
  Workers extends Record<
    string,
    {
      worker: FromPromiseFunctionToRD<E, AsyncRequest>;
      provideTags?: (
        resolved: RemoteData<any, any>
      ) => { type: Tag[number]; id?: number | string }[];
    }
  >,
  Mutations extends Record<
    string,
    {
      worker: FromPromiseFunctionToRD<E, AsyncRequest>;
      invalidate?: (
        resolved: RemoteData<any, any>
      ) => { type: Tag[number]; id?: number | string }[];
    }
  >
>({
  queries,
  mutations,
  makeError,
}: {
  tagTypes: Tag;
  makeError: (error: unknown) => E;
  queries: (
    proxy: <T extends AsyncRequest>(options: {
      worker: T;
      provideTags?: (
        resolved: FromPromiseToRD<E, ReturnType<T>>
      ) => { type: Tag[number]; id?: number | string }[];
    }) => {
      worker: FromPromiseFunctionToRD<E, T>;
      provideTags?: (
        resolved: FromPromiseToRD<E, ReturnType<T>>
      ) => { type: Tag[number]; id?: number | string }[];
    }
  ) => Workers;
  mutations: (
    proxy: <T extends AsyncRequest>(options: {
      worker: T;
      invalidate?: (
        resolved: FromPromiseToRD<E, ReturnType<T>>
      ) => { type: Tag[number]; id?: number | string }[];
    }) => {
      worker: FromPromiseFunctionToRD<E, T>;
      invalidate?: (
        resolved: FromPromiseToRD<E, ReturnType<T>>
      ) => { type: Tag[number]; id?: number | string }[];
    }
  ) => Mutations;
}) => {
  const cache: Record<string, CacheEntry> = {};
  const emitters: Record<
    string,
    BehaviorRemoteDataCached<unknown, unknown>
  > = {};
  const pendingInvalidations: Record<string, () => void> = {};

  const typedQueries = queries((a) => ({
    ...a,
    worker: flow(a.worker, fromPromise<E>(makeError)) as any,
  }));

  const byKey = <K extends PropertyKey, T>(
    key: K,
    record: Record<K, T>
  ): T | null => (record[key] === undefined ? null : record[key]);

  const setCache = <K extends keyof Workers>(
    key: K,
    query: Parameters<Workers[K]["worker"]>[0],
    newRD: RemoteData<any, any>,
    entry: Omit<CacheEntry, "latestState">
  ) => {
    const cacheKey = defaultSerializeQueryArgs({
      queryArgs: query,
      endpointName: key as string,
    });

    const emitter = byKey(cacheKey, emitters);

    const oldEntry = byKey(cacheKey, cache);

    const toCached =
      (isRefetching: boolean) =>
      <E, A>(rd: RemoteData<E, A>): RemoteDataCached<E, A> =>
        pipe(
          rd,
          remoteData.map((data) => ({ data, isRefetching })),
          remoteData.mapLeft((error) => ({ error, isRefetching }))
        );

    if (
      oldEntry !== null &&
      oldEntry.work === null &&
      entry.work !== null &&
      newRD === remoteData.pending
    ) {
      emitter?.set(pipe(oldEntry.latestState, toCached(true)));
    } else {
      emitter?.set(pipe(newRD, toCached(false)));
    }

    cache[cacheKey] = { ...entry, latestState: newRD };
  };

  const runWork = <K extends keyof Workers>(
    key: K,
    query: Parameters<Workers[K]["worker"]>[0]
  ): void => {
    const cacheKey = defaultSerializeQueryArgs({
      queryArgs: query,
      endpointName: key as string,
    });

    const work = typedQueries[key].worker(query).then((rd) => {
      setCache(key, query, rd, {
        work: null,
        query: query as any,
        key,
        tags: typedQueries[key].provideTags
          ? typedQueries[key].provideTags!(rd as any)
          : [],
      });

      const pendingWork = byKey(cacheKey, pendingInvalidations);
      pendingWork !== null && pendingWork();

      return rd;
    });

    setCache(key, query, remoteData.pending, {
      work,
      query: query as any,
      key,
      tags: [],
    });
  };

  const run = <K extends keyof Workers>(
    key: K,
    query: Parameters<Workers[K]["worker"]>[0]
  ): ToQueryResult<ReturnType<Workers[K]["worker"]>> => {
    const emitter = behavior.of(remoteData.pending) as BehaviorRemoteDataCached<
      any,
      any
    >;

    emitters[
      defaultSerializeQueryArgs({
        queryArgs: query,
        endpointName: key as string,
      })
    ] = emitter;

    runWork(key, query);

    return emitter as any;
  };

  const getOrRun =
    <K extends keyof Workers>(key: K) =>
    (
      query: Parameters<Workers[K]["worker"]>[0]
    ): ToQueryResult<ReturnType<Workers[K]["worker"]>> => {
      const cacheKey = defaultSerializeQueryArgs({
        queryArgs: query,
        endpointName: key as string,
      });
      const entry = byKey(cacheKey, cache);

      if (entry === null) {
        return run(key, query);
      } else {
        const emitter = byKey(cacheKey, emitters);

        return emitter as any;
      }
    };

  const queriesPublic: {
    [key in keyof Workers]: (
      query: Parameters<Workers[key]["worker"]>[0]
    ) => ToQueryResult<ReturnType<Workers[key]["worker"]>>;
  } = Object.keys(typedQueries).reduce(
    (acc, cur) => ({ ...acc, [cur]: getOrRun(cur) }),
    {} as any
  );

  const invalidate = (tags: { type: Tag[number]; id?: number | string }[]) => {
    const serialized = tags.map((tag) => JSON.stringify(tag));
    const toUpdate = Object.entries(cache).filter(([_, entry]) =>
      entry.tags.find((tag) => serialized.includes(JSON.stringify(tag)))
    );

    toUpdate.forEach(([_, entry]) => {
      // cancel the previous work(promise), if it exists?
      runWork(entry.key as any, entry.query);
    });
  };

  const typedMutations = mutations((a) => ({
    ...a,
    worker: flow(a.worker, fromPromise<E>(makeError)) as any,
  }));

  const runMutation =
    <K extends keyof Mutations>(key: K) =>
    (
      query: Parameters<Mutations[K]["worker"]>[0]
    ): ToMutationResult<ReturnType<Mutations[K]["worker"]>> => {
      const emitter = behavior.of(remoteData.pending as RemoteData<any, any>);

      typedMutations[key].worker(query).then((res) => {
        typedMutations[key].invalidate &&
          invalidate(typedMutations[key].invalidate!(res));
        emitter.set(res);
      });

      return emitter as any;
    };

  const mutationsPublic: {
    [key in keyof Mutations]: (
      query: Parameters<Mutations[key]["worker"]>[0]
    ) => ToMutationResult<ReturnType<Mutations[key]["worker"]>>;
  } = Object.keys(typedMutations).reduce(
    (acc, cur) => ({ ...acc, [cur]: runMutation(cur) }),
    {} as any
  );

  return {
    mutations: mutationsPublic,
    queries: queriesPublic,
    invalidate,
  };
};
