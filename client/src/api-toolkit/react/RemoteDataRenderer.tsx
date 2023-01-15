import { RemoteData } from "../core";
import { ComponentType, memo } from "react";

type RemoteDataRendererProps<E, T> = {
  data: RemoteData<E, T>;
  onInitial: () => JSX.Element;
  onSuccess: (result: T) => JSX.Element;
  onPending: () => JSX.Element;
  onError: (error: E) => JSX.Element;
};

const memoId = memo as <E extends ComponentType<any>>(e: E) => E;

export const RemoteDataRenderer = memoId(function <E, T>(
  props: RemoteDataRendererProps<E, T>
) {
  const { data, onSuccess, onError, onPending, onInitial } = props;

  switch (data.type) {
    case "initial":
      return onInitial();
    case "pending":
      return onPending();
    case "error":
      return onError(data.error as any);
    case "success":
      return onSuccess(data.data);
  }
});
