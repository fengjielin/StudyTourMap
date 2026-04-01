import { readFileSync } from 'fs';
import { resolve } from 'path';

// 配置动态代理 开发代理 webpack devServer，无需重启服务
const getProxyList = () => {
  try {
    const proxyList = readFileSync(resolve(__dirname, './proxy.list.json'), 'utf-8');
    return JSON.parse(proxyList);
  } catch (error) {
    throw new Error(error);
  }
};

const getActiveProxy = () => {
  try {
    const proxyList = getProxyList();
    if (proxyList.some((i) => i.active)) {
      return proxyList.find((i) => i.active);
    }
  } catch (error) {
    throw new Error(error);
  }
};

export default () => {
  console.log('[' + new Date().toLocaleString() + '] ' + 'ip: ', getActiveProxy().ip);
  return getActiveProxy().ip;
};
