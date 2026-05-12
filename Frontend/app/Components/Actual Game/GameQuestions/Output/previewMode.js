export const DESKTOP_VIEWPORT_WIDTH = 1024;

export const getPreviewLayout = ({ previewMode = 'web' } = {}) => {
  const mode = previewMode === 'web' ? 'web' : 'mobile';

  return {
    mode,
    containerStyle: null,
    frameStyle: null,
    webViewStyle: null,
  };
};
