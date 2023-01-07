import { remoteData, RemoteData } from "./RemoteData";

export type RemoteDataCached<E, A> = RemoteData<
  { error: E; isRefetching: boolean },
  { data: A; isRefetching: boolean }
>;

const uncache = <E, A>(rd: RemoteDataCached<E, A>): RemoteData<E, A> => {
  switch (rd.type) {
    case "success":
      return rd.data.isRefetching
        ? remoteData.pending
        : remoteData.makeSuccess(rd.data.data);
    case "error":
      return remoteData.makeError(rd.error);
    case "initial":
      return remoteData.initial;
    case "pending":
      return remoteData.pending;
  }
};

export const remoteDataCached = { uncache };
