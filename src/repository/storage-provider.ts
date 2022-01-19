import { join } from 'path';
import { promises } from 'fs';
import { ClientFeaturesResponse } from '../feature';
import { safeAppName } from '../helpers';

const { writeFile, readFile } = promises;

export interface StorageProvider<T> {
  save(data: T): Promise<void>;
  load(): Promise<T | undefined>;
}

export interface StorageOptions {
  backupPath: string;
  appName: string;
}

export class FileStorageProvider implements StorageProvider<ClientFeaturesResponse> {
  private path: string;

  constructor({ backupPath, appName }: StorageOptions) {
    this.path = join(backupPath, `/unleash-repo-schema-v2-${safeAppName(appName)}.json`);
  }

  async save(data: ClientFeaturesResponse): Promise<void> {
    return writeFile(this.path, JSON.stringify(data));
  }

  async load(): Promise<ClientFeaturesResponse | undefined> {
    let data;
    try {
      data = await readFile(this.path, 'utf8');
    } catch (error: any) {
      if (error?.code !== 'ENOENT') {
        throw error;
      } else {
        return undefined;
      }
    }

    try {
      return JSON.parse(data);
    } catch (error: any) {
      if (error instanceof Error) {
        error.message = `Unleash storage failed parsing file ${this.path}: ${error.message}`;
      }
      throw error;
    }
  }
}
