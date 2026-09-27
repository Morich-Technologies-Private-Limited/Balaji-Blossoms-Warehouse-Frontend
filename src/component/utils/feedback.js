import axios from "axios";

/**
 * App-wide feedback (replaces window.alert / window.confirm):
 *  - notify.success / notify.error / notify.warning -> result modal
 *  - confirmAction(message) -> Promise<boolean> confirm modal
 *  - waiting modal shown automatically while a save (non-GET) axios request is in flight
 * Rendered by <FeedbackModal /> (mounted once in main.jsx).
 */

// Waiting modal only appears if a request takes longer than this (avoids flicker on fast calls)
const LOADER_DELAY_MS = 300;

let state = { loading: false, dialogs: [] };
const listeners = new Set();

let notifyScheduled = false;

// Listeners are notified in a microtask so notify() is safe to call during another component's render
const setState = (patch) => {
  state = { ...state, ...patch };
  if (notifyScheduled) return;
  notifyScheduled = true;
  queueMicrotask(() => {
    notifyScheduled = false;
    listeners.forEach(listener => listener());
  });
};

export const subscribeFeedback = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getFeedbackState = () => state;

/* ================= RESULT / CONFIRM DIALOGS ================= */

let nextDialogId = 1;

const openDialog = (dialog) => {
  // Same message already queued (e.g. notify called inside a state updater that StrictMode runs twice)
  const duplicate = dialog.type !== "confirm" && state.dialogs.find(d =>
    d.type === dialog.type && d.title === dialog.title && d.message === dialog.message
  );
  if (duplicate) return duplicate.promise;

  let resolve;
  const promise = new Promise(res => { resolve = res; });
  setState({ dialogs: [...state.dialogs, { id: nextDialogId++, ...dialog, resolve, promise }] });
  return promise;
};

export const closeDialog = (id, result) => {
  const dialog = state.dialogs.find(d => d.id === id);
  if (!dialog) return;
  setState({ dialogs: state.dialogs.filter(d => d.id !== id) });
  dialog.resolve(result);
};

const toMessage = (message) => (message instanceof Error ? message.message : message) || "";

export const notify = {
  success: (message, title = "Success") => openDialog({ type: "success", title, message: toMessage(message) }),
  error: (message, title = "Something went wrong") => openDialog({ type: "error", title, message: toMessage(message) }),
  warning: (message, title = "Please check") => openDialog({ type: "warning", title, message: toMessage(message) }),
};

// Resolves true when the user confirms, false on cancel / Esc
export const confirmAction = (message, { title = "Are you sure?", confirmText = "Yes", cancelText = "Cancel", danger = false } = {}) =>
  openDialog({ type: "confirm", title, message, confirmText, cancelText, danger });

/* ================= WAITING MODAL ================= */

let pendingCount = 0;
let loaderTimer = null;

export const startLoading = () => {
  pendingCount += 1;
  if (pendingCount === 1 && !loaderTimer) {
    loaderTimer = setTimeout(() => {
      loaderTimer = null;
      if (pendingCount > 0) setState({ loading: true });
    }, LOADER_DELAY_MS);
  }
};

export const stopLoading = () => {
  pendingCount = Math.max(0, pendingCount - 1);
  if (pendingCount > 0) return;
  clearTimeout(loaderTimer);
  loaderTimer = null;
  if (state.loading) setState({ loading: false });
};

// Runs any async work (not only axios) behind the waiting modal
export const withLoading = async (work) => {
  startLoading();
  try {
    return await work();
  } finally {
    stopLoading();
  }
};

let interceptorsInstalled = false;

// GET requests load in the background (page stays usable); only saves (POST/PUT/PATCH/DELETE) block with
// the waiting modal. Override per call with { showLoader: true } or { skipLoader: true } in the axios config.
const shouldShowLoader = (config) => {
  if (config.skipLoader) return false;
  if (config.showLoader) return true;
  return (config.method || "get").toLowerCase() !== "get";
};

export const installAxiosLoader = () => {
  if (interceptorsInstalled) return;
  interceptorsInstalled = true;

  axios.interceptors.request.use(
    (config) => {
      if (shouldShowLoader(config)) {
        config.__trackedByLoader = true;
        startLoading();
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  axios.interceptors.response.use(
    (response) => {
      if (response.config?.__trackedByLoader) stopLoading();
      return response;
    },
    (error) => {
      if (error.config?.__trackedByLoader) stopLoading();
      return Promise.reject(error);
    }
  );
};
