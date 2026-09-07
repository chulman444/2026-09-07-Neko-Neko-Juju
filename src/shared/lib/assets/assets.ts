import bowlUrl from '@/shared/assets/cat-selections/bowl2.png';
import bowlSelectionUrl from '@/shared/assets/cat-selections/bowl-selection.png';
import emptySelectionUrl from '@/shared/assets/cat-selections/empty-selection.png';
import catHeadUrl from '@/shared/assets/cat-selections/cat-head2.png';

function createImage(src: string): HTMLImageElement {
  const img = new Image();
  img.src = src;
  return img;
}

export const gameAssets = {
  bowl: createImage(bowlUrl),
  bowlSelection: createImage(bowlSelectionUrl),
  emptySelection: createImage(emptySelectionUrl),
  catHead: createImage(catHeadUrl),
};
