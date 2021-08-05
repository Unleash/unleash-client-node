import { resolve } from 'url';

const getUrl = (
  base: string,
  projectName?: string,
  namePrefix?: string,
  tags?: Array<string>,
): string => {
  const url = resolve(base, './client/features');
  const params = new URLSearchParams(url);
  if (projectName) {
    params.append('project', projectName);
  }
  if (namePrefix) {
    params.append('namePrefix', namePrefix);
  }
  if (tags) {
    tags.forEach((tag) => {
      params.append('tag', tag);
    });
  }
  return `${url}?${decodeURIComponent(params.toString())}`;
};

export const suffixSlash = (url: string): string => (url.endsWith('/') ? url : `${url}/`);

export default getUrl;
