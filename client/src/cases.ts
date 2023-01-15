import { Todo } from "./api/base";
import { api } from "./api/api";
import {
  behavior,
  behaviorRemoteData,
  remoteData,
  remoteDataCached,
  flow,
  pipe,
} from "./api-toolkit";

const mapped = flow(
  api.queries.getTodos,
  behaviorRemoteData.map(
    remoteDataCached.mapSuccess((data) =>
      data.map(({ text }) => ({
        text,
        textLength: text.length,
      }))
    )
  )
);

const combined = (id: number) =>
  pipe(
    behaviorRemoteData.combineT(
      api.queries.getTodos(undefined),
      api.queries.getTodo(id)
    ),
    behaviorRemoteData.map(
      ([todos, todo]) =>
        todos.data.find(({ id }) => id === todo.data.id) !== undefined
    )
  );

const chained = pipe(
  api.queries.getTodos(undefined),
  behavior.map(remoteDataCached.uncache), // only process new values(filter refetch)
  behaviorRemoteData.chain((data) => api.queries.getTodo(data.length))
);

const chainedMutation = (deleteOneIf: (todo: Todo) => boolean) =>
  pipe(
    api.queries.getTodos(undefined),
    behavior.map(remoteDataCached.uncache),
    behavior.map(
      remoteData.chain((todos) => {
        const target = todos.find(deleteOneIf);

        return target === undefined
          ? remoteData.makeError(new Error("No todo satisfies the predicate"))
          : remoteData.makeSuccess(target);
      })
    ),
    behaviorRemoteData.chain((target) => api.mutations.deleteTodo(target))
  );
