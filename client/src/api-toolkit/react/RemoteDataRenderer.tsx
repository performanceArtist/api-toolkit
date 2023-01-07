import { RemoteData } from "../core";
import { ComponentType, memo } from "react";

type RemoteDataRendererProps<T> = {
  data: RemoteData<unknown, T>;
  onInitial: () => JSX.Element;
  onSuccess: (result: T) => JSX.Element;
  onPending: () => JSX.Element;
  onError: (error: Error) => JSX.Element;
};

const memoId = memo as <E extends ComponentType<any>>(e: E) => E;

export const RemoteDataRenderer = memoId(function <T>(
  props: RemoteDataRendererProps<T>
) {
  const { data, onSuccess, onError, onPending, onInitial } = props;

  switch (data.type) {
    case "initial":
      return onInitial();
    case "pending":
      return onPending();
    case "error":
      return onError(new Error(String(data.error)));
    case "success":
      return onSuccess(data.data);
  }
});
