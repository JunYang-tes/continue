import path from "path";

import workerpool from "workerpool";

export interface AsyncEncoder {
  encode(text: string): Promise<number[]>;
  decode(tokens: number[]): Promise<string>;
  close(): Promise<void>;
}

export class LlamaAsyncEncoder implements AsyncEncoder {
  private workerPool: workerpool.Pool;

  constructor() {
    this.workerPool = workerpool.pool(
      workerCodeFilePath("llamaTokenizerWorkerPool.js"),// swc transpiles this to js
    );
  }

  async encode(text: string): Promise<number[]> {
    return this.workerPool.exec("encode", [text]);
  }

  async decode(tokens: number[]): Promise<string> {
    return this.workerPool.exec("decode", [tokens]);
  }

  // TODO: this should be called somewhere before exit or potentially with a shutdown hook
  public async close(): Promise<void> {
    await this.workerPool.terminate();
  }
}

// this class does not yet do anything asynchronous
export class GPTAsyncEncoder implements AsyncEncoder {
  private workerPool: workerpool.Pool;

  constructor() {
    this.workerPool = workerpool.pool(
      workerCodeFilePath("tiktokenWorkerPool.js"),
    );
  }

  async encode(text: string): Promise<number[]> {
    return this.workerPool.exec("encode", [text]);
  }

  async decode(tokens: number[]): Promise<string> {
    return this.workerPool.exec("decode", [tokens]);
  }

  // TODO: this should be called somewhere before exit or potentially with a shutdown hook
  public async close(): Promise<void> {
    await this.workerPool.terminate();
  }
}

function workerCodeFilePath(workerFileName: string): string {
  if (process.env.NODE_ENV === "test") {
    // `cross-env` seems to make it so import.meta.dirname is the root of the project and not the directory containing this file
    return path.join(import.meta.dirname, "llm", workerFileName);
  }
  return path.join(import.meta.dirname, workerFileName);
}
