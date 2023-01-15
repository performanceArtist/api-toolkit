import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Todo } from "./api/base";
import { api } from "./api/api";
import {
  useQuery,
  useMutation,
  remoteData,
  behavior,
  pipe,
  RemoteDataCached,
  RemoteDataRenderer,
} from "./api-toolkit";
import { RemoteDataDefault } from "./shared/components/RemoteDataDefault";
import "./cases";

export function TodoApp() {
  const todos = useQuery(api.queries.getTodos(undefined));
  const [deleteTodo] = useMutation(api.mutations.deleteTodo);
  const [updateTodo] = useMutation(api.mutations.updateTodo);
  const [addTodo] = useMutation(api.mutations.createTodo);
  const [input, setInput] = useState("");

  const onAdd = useCallback(() => {
    addTodo(input);
    setInput("");
  }, [addTodo]);

  const onToggle = useCallback(
    (todo: Todo) => updateTodo({ ...todo, done: !todo.done }),
    [updateTodo]
  );

  const onDelete = useCallback((todo: Todo) => deleteTodo(todo), [deleteTodo]);

  return (
    <div className="App">
      <div className="todos">
        <RemoteDataDefault
          data={todos}
          onSuccess={(todos) => (
            <React.Fragment>
              {todos.data.map((todo) => (
                <React.Fragment key={todo.id}>
                  <div>
                    <input
                      type="checkbox"
                      checked={todo.done}
                      onChange={() => onToggle(todo)}
                    />
                    <span>{todo.text}</span>
                  </div>
                  <button onClick={() => onDelete(todo)}>Delete</button>
                </React.Fragment>
              ))}
            </React.Fragment>
          )}
        />
      </div>
      <div className="add">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <button onClick={onAdd}>Add</button>
      </div>
      <Inner />
      <LoadOnClick />
    </div>
  );
}

const Inner = () => {
  // shares query state with TodoApp(no additional requests)
  const todos = useQuery(api.queries.getTodos(undefined));
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    todos.type === "success" &&
      todos.data.isRefetching &&
      setCounter(counter + 1);
  }, [todos, setCounter]);

  return (
    <RemoteDataDefault
      data={todos}
      onSuccess={(todos) => (
        <h2>
          TODO LENGTH: {todos.data.length}, REFETCHES: {counter}
        </h2>
      )}
    />
  );
};

const click = behavior.of<number | null>(null);

const todoOnClick = pipe(
  click,
  behavior.chain((id) =>
    id === null
      ? behavior.of(remoteData.initial as RemoteDataCached<Error, Todo>)
      : api.queries.getTodo(id)
  )
);

const onRefetch = (data: { isRefetching: boolean }) =>
  data.isRefetching ? <div>Refetching...</div> : null;

const LoadOnClick = () => {
  const todo = useQuery(todoOnClick);

  return (
    <div>
      <button
        onClick={() => {
          const current = click.get();
          current === null ? click.set(1) : click.set(current + 1);
        }}
      >
        Load
      </button>
      <RemoteDataRenderer
        data={todo}
        onInitial={() => <div>Click to load</div>}
        onError={(e) => (
          <div>
            Error
            {onRefetch(e)}
          </div>
        )}
        onPending={() => <div>Loading...</div>}
        onSuccess={(todo) => (
          <div>
            {todo.data.text}
            {onRefetch(todo)}
          </div>
        )}
      />
    </div>
  );
};
