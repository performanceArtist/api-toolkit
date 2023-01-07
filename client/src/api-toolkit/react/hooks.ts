import { useEffect, useState } from "react";
import { RemoteData, remoteData, BehaviorRemoteData } from "../core";

export const useQuery = <E, A>(p: BehaviorRemoteData<E, A>) => {
  const [rd, setRD] = useState(remoteData.initial as RemoteData<E, A>);

  useEffect(() => {
    const { unsubscribe } = p.subscribe((value) => setRD(value));

    return unsubscribe;
  }, [p]);

  return rd;
};

export const useMutation = <Q, E, A>(
  f: (query: Q) => BehaviorRemoteData<E, A>
) => {
  const [state, setState] = useState(remoteData.initial as RemoteData<E, A>);

  const worker = (query: Q) => {
    f(query).subscribe((rd) => setState(rd));
  };

  return [worker, state] as [(query: Q) => void, RemoteData<E, A>];
};
