import vue from '@vitejs/plugin-vue';
import path from 'path';
import fs from 'fs';
import createAutoImport from './auto-import';
import createSvgIcon from './svg-icon';
import createCompression from './compression';
import createSetupExtend from './setup-extend';
import type { PluginOption } from 'vite';

export default function createVitePlugins(viteEnv: Record<string, string>, isBuild = false) {
  const vitePlugins: PluginOption[] = [vue()];
  vitePlugins.push(createAutoImport());
  vitePlugins.push(createSetupExtend());
  vitePlugins.push(createSvgIcon(isBuild));
  isBuild && vitePlugins.push(...createCompression(viteEnv));

  // 多入口 fallback 插件（仅在开发环境）
  // Vite 开发服务器插件，作用是解决多入口（后台 + 门户）在 history 路由模式下的刷新 404 问题
  // if (!isBuild) {
  //   vitePlugins.push({
  //     name: 'multi-entry-fallback',
  //     configureServer(server) {
  //       // 使用 stack.unshift 插到最前面，在 Vite 的 indexHtmlMiddleware 之前执行
  //       server.middlewares.stack.unshift({
  //         route: '', // 匹配所有路径
  //         handle: async (req, res, next) => {
  //           const url = req.url;
  //           // 获取 pathname（去掉查询参数）
  //           const pathname = new URL(url, 'http://localhost').pathname;
  //           if (pathname.includes('/@') || pathname.includes('.')) {
  //             return next();
  //           }
  //           const base = '/studyTourMapPage';
  //           let htmlFile: string | null = null;
  //           // 判断路由归属
  //           if (url.startsWith(`${base}/portal`)) {
  //             htmlFile = 'index-portal.html';
  //           } else if (url.startsWith(base)) {
  //             htmlFile = 'index.html';
  //           }
  //           if (htmlFile) {
  //             try {
  //               const htmlPath = path.join(server.config.root, htmlFile);
  //               // 检查文件存在
  //               if (!fs.existsSync(htmlPath)) {
  //                 return next();
  //               }
  //               // 使用 Vite 的 transformIndexHtml 处理 HTML
  //               // 关键是：直接返回 HTML，拦截后续所有中间件
  //               const html = await server.transformIndexHtml(url, fs.readFileSync(htmlPath, 'utf-8'));
  //               res.setHeader('Content-Type', 'text/html');
  //               res.end(html);
  //               return; //  必须 return，阻止后续中间件执行（包括 Vite 的默认 fallback）
  //             } catch (e) {
  //               console.error('Fallback error:', e);
  //               return next(e);
  //             }
  //           }

  //           next();
  //         },
  //       });
  //     },
  //   });
  // }
  return vitePlugins;
}
