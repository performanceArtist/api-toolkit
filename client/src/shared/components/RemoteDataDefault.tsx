import React from "react";
import { RemoteDataRenderer, RemoteData } from "../../api-toolkit";

type RemoteDataProps<T> = {
  data: RemoteData<unknown, T>;
  onSuccess: (result: T) => JSX.Element;
};

type RemoteDataDefaults = {
  onError?: (error: Error) => JSX.Element;
  onPending?: () => JSX.Element;
  onInitial?: () => JSX.Element;
};

const onErrorDefault = (error: Error) => <h2>{error.toString()}</h2>;
const onPendingDefault = () => <div>Loading...</div>;
const onInitialDefault = () => <div>Loading...</div>;

export const makeRemoteDataDefault = ({
  onError,
  onInitial,
  onPending,
}: RemoteDataDefaults) =>
  function <T>({ data, onSuccess }: RemoteDataProps<T>) {
    return (
      <RemoteDataRenderer
        onError={onError || onErrorDefault}
        onPending={onPending || onPendingDefault}
        onInitial={onInitial || onInitialDefault}
        onSuccess={onSuccess}
        data={data}
      />
    );
  };

export const RemoteDataDefault = makeRemoteDataDefault({});
