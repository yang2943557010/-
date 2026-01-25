/**
 * 资源缓存管理器 - 优化性能和加载速度
 */
class CacheManager {
  constructor() {
    this.cacheName = 'qr-page-v1';
    this.supported = 'caches' in window;
    this.preloadedResources = new Set();
  }

  /**
   * 预加载资源
   */
  async preloadResource(url, type = 'fetch') {
    if (this.preloadedResources.has(url)) {
      return Promise.resolve();
    }

    try {
      if (type === 'image') {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            this.preloadedResources.add(url);
            resolve(img);
          };
          img.onerror = reject;
          img.src = url;
        });
      } else if (type === 'script') {
        if (document.querySelector(`script[src="${url}"]`)) {
          return Promise.resolve();
        }
        const script = document.createElement('script');
        script.src = url;
        script.defer = true;
        script.async = true;
        document.head.appendChild(script);
        this.preloadedResources.add(url);
        return new Promise(resolve => {
          script.onload = resolve;
        });
      } else if (type === 'style') {
        if (document.querySelector(`link[href="${url}"]`)) {
          return Promise.resolve();
        }
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        document.head.appendChild(link);
        this.preloadedResources.add(url);
        return new Promise(resolve => {
          link.onload = resolve;
        });
      } else {
        // 对于fetch请求
        if (this.supported) {
          const cache = await caches.open(this.cacheName);
          const cachedResponse = await cache.match(url);
          if (!cachedResponse) {
            await cache.add(url);
          }
        } else {
          // 不支持cache API时，使用fetch预加载
          await fetch(url, { method: 'HEAD' });
        }
        this.preloadedResources.add(url);
      }
    } catch (error) {
      console.warn(`Failed to preload resource: ${url}`, error);
    }
  }

  /**
   * 批量预加载资源
   */
  async preloadResources(resources) {
    const promises = resources.map(resource => {
      if (typeof resource === 'string') {
        // 自动检测资源类型
        if (/\.(png|jpe?g|gif|svg|webp)$/i.test(resource)) {
          return this.preloadResource(resource, 'image');
        } else if (/\.(css)$/i.test(resource)) {
          return this.preloadResource(resource, 'style');
        } else if (/\.(js)$/i.test(resource)) {
          return this.preloadResource(resource, 'script');
        } else {
          return this.preloadResource(resource, 'fetch');
        }
      } else {
        return this.preloadResource(resource.url, resource.type);
      }
    });

    return Promise.allSettled(promises);
  }

  /**
   * 获取缓存的资源
   */
  async getCachedResource(url) {
    if (this.supported) {
      try {
        const cache = await caches.open(this.cacheName);
        return await cache.match(url);
      } catch (error) {
        console.warn('Cache access failed:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * 检查资源是否已缓存
   */
  async isCached(url) {
    if (this.supported) {
      try {
        const cache = await caches.open(this.cacheName);
        return await cache.match(url) !== undefined;
      } catch (error) {
        return false;
      }
    }
    return this.preloadedResources.has(url);
  }

  /**
   * 清除缓存
   */
  async clearCache() {
    if (this.supported) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter(name => name.startsWith('qr-page-'))
            .map(name => caches.delete(name))
        );
      } catch (error) {
        console.warn('Cache clearing failed:', error);
      }
    }
    this.preloadedResources.clear();
  }

  /**
   * 清除过期缓存
   */
  async cleanupExpired() {
    if (this.supported) {
      try {
        const cache = await caches.open(this.cacheName);
        const keys = await cache.keys();
        // 过滤掉长时间未使用的缓存（这里简化处理）
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
        
        await Promise.all(
          keys.map(async request => {
            // 检查是否过期（实际实现可能需要在缓存时记录时间戳）
            // 这里我们只是示例，实际实现会更复杂
          })
        );
      } catch (error) {
        console.warn('Cache cleanup failed:', error);
      }
    }
  }
}

// 创建全局实例
window.CacheManager = new CacheManager();

// 预加载常见资源
document.addEventListener('DOMContentLoaded', () => {
  // 预加载可能用到的网盘logo资源
  const commonResources = [
    'https://testlink11.oss-cn-beijing.aliyuncs.com/baidu-logo.png',
    'https://testlink11.oss-cn-beijing.aliyuncs.com/quark-logo.png',
    'https://img.alicdn.com/imgextra/i1/O1CN01JDQCi21Hp8ASbOY1a_!!6000000000806-2-tps-512-512.png',
    'perf-optimized.css',
    'app.js',
    'enhancements.js'
  ];

  // 使用空闲回调进行预加载，不影响主线程
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      window.CacheManager.preloadResources(commonResources);
    }, { timeout: 2000 });
  } else {
    setTimeout(() => {
      window.CacheManager.preloadResources(commonResources);
    }, 1000);
  }
});