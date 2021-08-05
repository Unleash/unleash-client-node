import { resolve } from 'url';

const getUrl = (base: string, projectName?: string, namePrefix?: string): string => {
  const url = resolve(base, './client/features');
  const params = new URLSearchParams();
  if (projectName) {
    params.append('project', projectName);
  }
  if (namePrefix) {
    params.append('namePrefix', namePrefix);
  }
  return `${url}?${params.toString()}`;
};

export const suffixSlash = (url: string): string => (url.endsWith('/') ? url : `${url}/`);

export default getUrl;
