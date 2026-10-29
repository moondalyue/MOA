export type ActionResult = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
};
