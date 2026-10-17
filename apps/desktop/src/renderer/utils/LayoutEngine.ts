import { LayoutType, PanelLayout } from '@workspacebrowser/types';

export const getLayoutPreset = (
  type: LayoutType,
  panelsCount: number,
  existingLayouts?: Record<string, PanelLayout>
): any[] => {

  if (type === 'custom' && existingLayouts) {
    return Object.keys(existingLayouts).map((id) => ({
      i: id,
      x: existingLayouts[id].x,
      y: existingLayouts[id].y,
      w: existingLayouts[id].w,
      h: existingLayouts[id].h,
    }));
  }

  const layouts: any[] = [];

  // Grid configuration
  const ROW_HEIGHT = 38;
  const HEADER_HEIGHT = 60;

  const availableHeight =
    typeof window !== 'undefined'
      ? window.innerHeight - HEADER_HEIGHT
      : 900;

  const totalRows = Math.max(
    1,
    Math.floor(availableHeight / ROW_HEIGHT)
  );

  for (let idx = 0; idx < panelsCount; idx++) {
    let x = 0;
    let y = 0;
    let w = 12;
    let h = totalRows;

    switch (type) {
      case '1':
        // Full screen
        w = 12;
        h = (totalRows / 4);
        x = 0;
        y = 0;
        break;

      case '2x2':
        // 2 columns × 2 rows
        w = 6;
        h = (totalRows / 4);

        x = (idx % 2) * 6;
        y = Math.floor(idx / 2) * h;
        break;

      case '3x2':
        // 3 columns × 2 rows
        w = 4;
        h = (totalRows / 4);

        x = (idx % 3) * 4;
        y = Math.floor(idx / 3) * h;
        break;

      case '4x2':
        // 4 columns × 2 rows
        w = 3;
        h = (totalRows / 4);

        x = (idx % 4) * 3;
        y = Math.floor(idx / 4) * h;
        break;

      case '4x4':
        // 4 columns × 4 rows
        w = 6;
        h = (totalRows / 6);

        x = (idx % 2) * 6;
        y = Math.floor(idx / 2) * h;
        break;

      default:
        // Fallback
        w = 6;
        h = (totalRows / 2);

        x = (idx % 2) * 6;
        y = Math.floor(idx / 2) * h;
    }

    layouts.push({
      i: `placeholder-${idx}`, x, y, w, h,
    });
  }

  return layouts;
};