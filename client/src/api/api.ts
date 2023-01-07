import { makeApi } from "../api-toolkit";
import { createTodo, deleteTodo, getTodo, getTodos, updateTodo } from "./base";

export const api = makeApi({
  makeError: (e) => new Error(JSON.stringify(e)),
  tagTypes: ["todos"] as const,
  queries: (make) => ({
    getTodos: make({
      worker: getTodos,
      provideTags: () => [{ type: "todos", id: "all" }],
    }),
    getTodo: make({
      worker: getTodo,
      provideTags: (todo) =>
        todo.type === "success" ? [{ type: "todos", id: todo.data.id }] : [],
    }),
  }),
  mutations: (make) => ({
    createTodo: make({
      worker: createTodo,
      invalidate: () => [{ type: "todos", id: "all" }],
    }),
    updateTodo: make({
      worker: updateTodo,
      invalidate: (todo) =>
        todo.type === "success"
          ? [
              { type: "todos", id: "all" },
              { type: "todos", id: todo.data.id },
            ]
          : [],
    }),
    deleteTodo: make({
      worker: deleteTodo,
      invalidate: (todo) =>
        todo.type === "success"
          ? [
              { type: "todos", id: "all" },
              { type: "todos", id: todo.data.id },
            ]
          : [],
    }),
  }),
});
