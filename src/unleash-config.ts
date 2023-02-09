import { CustomHeaders, CustomHeadersFunction } from './headers';
import { Strategy } from './strategy';

import { ClientFeaturesResponse } from './feature';
import { HttpOptions } from './http-options';
import { TagFilter } from './tags';
import { BootstrapOptions } from './repository/bootstrap-provider';
import { StorageProvider } from './repository/storage-provider';
import { RepositoryInterface } from './repository';

export interface UnleashConfig {
    appName: string;
    environment?: string;
    instanceId?: string;
    url: string;
    refreshInterval?: number;
    projectName?: string;
    metricsInterval?: number;
    metricsJitter?: number;
    namePrefix?: string;
    disableMetrics?: boolean;
    backupPath?: string;
    strategies?: Strategy[];
    customHeaders?: CustomHeaders;
    customHeadersFunction?: CustomHeadersFunction;
    timeout?: number;
    repository?: RepositoryInterface;
    httpOptions?: HttpOptions;
    tags?: Array<TagFilter>;
    bootstrap?: BootstrapOptions;
    bootstrapOverride?: boolean;
    storageProvider?: StorageProvider<ClientFeaturesResponse>;
    disableAutoStart?: boolean;
    skipInstanceCountWarning?: boolean;
  }