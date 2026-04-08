import { universalAssetPreloader } from '../../../../services/preloader/universalAssetPreloader';

export const cacheMethods = {
  _getCachedUrl(url) {
    if (this._urlCache.has(url)) {
      return this._urlCache.get(url);
    }

    const cachedPath = universalAssetPreloader.getCachedAssetPath(url);

    if (cachedPath && cachedPath.startsWith('file://')) {
      this._urlCache.set(url, cachedPath);
      return cachedPath;
    }

    let resolvedUrl = url;
    if (url && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
      resolvedUrl = `https://${url}`;
    }

    this._urlCache.set(url, resolvedUrl);
    return resolvedUrl;
  },

  clearUrlCache() {
    this._urlCache.clear();
  },
};
