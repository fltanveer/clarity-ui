import "@testing-library/jest-dom/vitest";

/* jsdom defaults to a 1024px window; the shell folds the members pane below
   1280px. Tests run at a desktop width unless a test narrows it. */
Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: 1440 });
