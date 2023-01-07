import React, { useCallback, useEffect, useState } from "react";
import { Todo } from "./api/base";
import { api } from "./api/api";
import { useQuery, useMutation } from "./api-toolkit";
import { RemoteDataDefault } from "./shared/components/RemoteDataDefault";

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
