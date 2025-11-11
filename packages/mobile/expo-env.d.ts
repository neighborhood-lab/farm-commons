/// <reference types="expo/types" />

declare module '*.png' {
  const content: number;
  export default content;
}

declare module '*.jpg' {
  const content: number;
  export default content;
}

declare module '*.json' {
  const content: Record<string, unknown>;
  export default content;
}
