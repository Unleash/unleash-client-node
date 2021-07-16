import { resolve } from 'url';

const getUrl = (base: string, projectName?: string): string => {
  if (projectName) {
    return resolve(base, `./client/features?project=${projectName}`);
  }
  return resolve(base, './client/features');
};

export const suffixSlash = (url: string): string => (url.endsWith('/') ? url : `${url}/`);

export default getUrl;
