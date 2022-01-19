import { ClientFeaturesResponse } from '../feature';
import { StorageProvider } from './storage-provider';

export default class InMemStorageProvider implements StorageProvider<ClientFeaturesResponse> {
  private data?: ClientFeaturesResponse;

  async save(data: ClientFeaturesResponse): Promise<void> {
    this.data = data;
    return Promise.resolve();
  }

  async load(): Promise<ClientFeaturesResponse | undefined> {
    return Promise.resolve(this.data);
  }
}
