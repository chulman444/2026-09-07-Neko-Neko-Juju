import type { TileCoord } from '@/entities/board';
import { gameAssets } from '@/shared/lib/assets';
import { getGridPitch } from '../lib/coordinates';
import type { InteractionSnapshot, BoardRenderState, BoardVisualConfig } from './types';

export class GameBoardRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private targetSum: number;

  // Active Frame State
  private board!: BoardRenderState;
  private visualConfig!: BoardVisualConfig;
  private interaction!: InteractionSnapshot;
  private highlightedTiles: TileCoord[] = [];
  private pitch = 0;
  private now = 0;
  private isValidBoxSum = false;
  private isValidDiagSum = false;
  private boxActiveColor = '';
  private diagActiveColor = '';

  constructor(canvas: HTMLCanvasElement, targetSum = 10) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to obtain 2D context from canvas');
    }
    this.ctx = ctx;
    this.targetSum = targetSum;
  }

  public setTargetSum(targetSum: number): void {
    this.targetSum = targetSum;
  }

  public render(
    board: BoardRenderState,
    visualConfig: BoardVisualConfig,
    interaction: InteractionSnapshot,
    highlightedTiles: TileCoord[],
    now: number
  ): void {
    this.board = board;
    this.visualConfig = visualConfig;
    this.interaction = interaction;
    this.highlightedTiles = highlightedTiles;
    this.now = now;
    this.pitch = getGridPitch(board.shapeSize, board.tileBorder);

    // Canvas Resizing
    const targetWidth = board.cols * this.pitch;
    const targetHeight = board.rows * this.pitch;
    if (this.canvas.width !== targetWidth) this.canvas.width = targetWidth;
    if (this.canvas.height !== targetHeight) this.canvas.height = targetHeight;

    const { activeAction, boxTiles, isSquare, diagonalSelected, boxSum, diagSum } = interaction;
    this.isValidBoxSum =
      activeAction === 'box' && boxSum === this.targetSum && boxTiles.length > 0;
    this.isValidDiagSum =
      (activeAction === 'box' &&
        visualConfig.groupingMode === 'auto-square' &&
        isSquare &&
        diagSum === this.targetSum) ||
      (activeAction === 'diagonal' &&
        diagSum === this.targetSum &&
        diagonalSelected.length > 0);

    this.boxActiveColor = this.isValidBoxSum ? visualConfig.validColor : visualConfig.selectionColor;
    this.diagActiveColor = this.isValidDiagSum ? visualConfig.validColor : visualConfig.selectionColor;

    // Visual passes
    this.drawBackground();
    this.drawBaseBowls();
    this.drawHintHighlights();
    this.drawSelectionOverlays();
    this.drawValidSumCatHeads();
    this.drawSelectionIndicators();
    this.drawNumberText();
    this.drawClearingAnimations();
  }

  // Layer 1: Background
  private drawBackground(): void {
    this.ctx.fillStyle = this.visualConfig.gameBg;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Layer 2: Base Bowls (with vector fallback)
  private drawBaseBowls(): void {
    const { matrix, rows, cols, shapeSize, tileBorder } = this.board;
    const hasImage = gameAssets.bowl.complete && gameAssets.bowl.naturalWidth > 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = matrix[r]?.[c] ?? 0;
        if (val === 0) continue;
        const cellX = c * this.pitch + tileBorder;
        const cellY = r * this.pitch + tileBorder;

        if (hasImage) {
          this.ctx.drawImage(gameAssets.bowl, cellX, cellY, shapeSize, shapeSize);
        } else {
          // Clean vector bowl fallback
          this.ctx.fillStyle = '#fff4e6';
          this.ctx.beginPath();
          this.ctx.roundRect(cellX, cellY, shapeSize, shapeSize, 10);
          this.ctx.fill();
          this.ctx.strokeStyle = '#e0a96d';
          this.ctx.lineWidth = 1.5;
          this.ctx.stroke();
        }
      }
    }
  }

  // Layer 2.5: Hint Highlights (pulsating golden aura)
  private drawHintHighlights(): void {
    if (!this.highlightedTiles || this.highlightedTiles.length === 0) return;
    const { shapeSize, tileBorder } = this.board;

    const pulse = 0.5 + 0.5 * Math.sin(this.now / 180);
    this.ctx.strokeStyle = `rgba(245, 158, 11, ${0.4 + pulse * 0.5})`;
    this.ctx.fillStyle = `rgba(254, 240, 138, ${0.2 + pulse * 0.25})`;
    this.ctx.lineWidth = 3;

    for (let i = 0; i < this.highlightedTiles.length; i++) {
      const t = this.highlightedTiles[i];
      const cellX = t.col * this.pitch + tileBorder;
      const cellY = t.row * this.pitch + tileBorder;

      this.ctx.beginPath();
      this.ctx.roundRect(cellX - 2, cellY - 2, shapeSize + 4, shapeSize + 4, 8);
      this.ctx.fill();
      this.ctx.stroke();
    }
  }

  // Layer 3: Selection Overlays
  private drawSelectionOverlays(): void {
    const { matrix, shapeSize, tileBorder } = this.board;
    const { activeAction, boxTiles, diagonalTiles, diagonalSelected } = this.interaction;

    const hasBowlSel =
      gameAssets.bowlSelection.complete && gameAssets.bowlSelection.naturalWidth > 0;
    const hasEmptySel =
      gameAssets.emptySelection.complete && gameAssets.emptySelection.naturalWidth > 0;

    if (activeAction === 'box') {
      for (let i = 0; i < boxTiles.length; i++) {
        const t = boxTiles[i];
        const cellX = t.col * this.pitch + tileBorder;
        const cellY = t.row * this.pitch + tileBorder;
        const val = matrix[t.row]?.[t.col] ?? 0;

        let isDiagTile = false;
        for (let d = 0; d < diagonalTiles.length; d++) {
          const dt = diagonalTiles[d];
          if (dt && dt.col === t.col && dt.row === t.row) {
            isDiagTile = true;
            break;
          }
        }

        if (val > 0) {
          if (this.isValidBoxSum) continue;
          if (this.isValidDiagSum && isDiagTile) continue;
          if (hasBowlSel) {
            this.ctx.drawImage(gameAssets.bowlSelection, cellX, cellY, shapeSize, shapeSize);
          } else {
            this.ctx.fillStyle = 'rgba(255, 159, 28, 0.25)';
            this.ctx.beginPath();
            this.ctx.roundRect(cellX, cellY, shapeSize, shapeSize, 8);
            this.ctx.fill();
          }
        } else if (hasEmptySel) {
          this.ctx.drawImage(gameAssets.emptySelection, cellX, cellY, shapeSize, shapeSize);
        } else {
          this.ctx.fillStyle = 'rgba(255, 159, 28, 0.1)';
          this.ctx.beginPath();
          this.ctx.roundRect(cellX, cellY, shapeSize, shapeSize, 8);
          this.ctx.fill();
        }
      }
    } else if (activeAction === 'diagonal') {
      for (let i = 0; i < diagonalSelected.length; i++) {
        const t = diagonalSelected[i];
        const cellX = t.col * this.pitch + tileBorder;
        const cellY = t.row * this.pitch + tileBorder;
        const val = matrix[t.row]?.[t.col] ?? 0;

        if (val > 0) {
          if (this.isValidDiagSum) continue;
          if (hasBowlSel) {
            this.ctx.drawImage(gameAssets.bowlSelection, cellX, cellY, shapeSize, shapeSize);
          } else {
            this.ctx.fillStyle = 'rgba(255, 159, 28, 0.25)';
            this.ctx.beginPath();
            this.ctx.roundRect(cellX, cellY, shapeSize, shapeSize, 8);
            this.ctx.fill();
          }
        } else if (hasEmptySel) {
          this.ctx.drawImage(gameAssets.emptySelection, cellX, cellY, shapeSize, shapeSize);
        }
      }
    }
  }

  // Layer 4: Valid Sum Cat Heads
  private drawValidSumCatHeads(): void {
    const { matrix, shapeSize, tileBorder } = this.board;
    const { activeAction, boxTiles, diagonalTiles, diagonalSelected, isSquare } = this.interaction;
    const headSize = shapeSize * 0.95;
    const headOffset = (shapeSize - headSize) / 2;
    const hasCatHead = gameAssets.catHead.complete && gameAssets.catHead.naturalWidth > 0;

    const drawCatHeadAtTile = (t: TileCoord) => {
      const val = matrix[t.row]?.[t.col] ?? 0;
      if (val > 0) {
        const cellX = t.col * this.pitch + tileBorder;
        const cellY = t.row * this.pitch + tileBorder;

        if (hasCatHead) {
          this.ctx.drawImage(
            gameAssets.catHead,
            cellX + headOffset,
            cellY + headOffset - shapeSize * 0.05,
            headSize,
            headSize
          );
        } else {
          // Vector green cat aura
          this.ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
          this.ctx.beginPath();
          this.ctx.roundRect(cellX, cellY, shapeSize, shapeSize, 12);
          this.ctx.fill();
        }
      }
    };

    if (activeAction === 'box') {
      if (this.isValidBoxSum) {
        boxTiles.forEach(drawCatHeadAtTile);
      } else if (
        this.visualConfig.groupingMode === 'auto-square' &&
        isSquare &&
        this.isValidDiagSum
      ) {
        diagonalTiles.forEach(drawCatHeadAtTile);
      }
    } else if (activeAction === 'diagonal' && this.isValidDiagSum) {
      diagonalSelected.forEach(drawCatHeadAtTile);
    }
  }

  // Layer 5: Selection Indicators (Border bounding box & diagonal ray)
  private drawSelectionIndicators(): void {
    const { activeAction, startTile, currentTile, dragCurrent, isSquare, dirX, dirY, isShiftPressed } =
      this.interaction;
    const { cols, rows } = this.board;

    if (activeAction === 'box') {
      const minCol = Math.min(startTile.col, currentTile.col);
      const maxCol = Math.max(startTile.col, currentTile.col);
      const minRow = Math.min(startTile.row, currentTile.row);
      const maxRow = Math.max(startTile.row, currentTile.row);

      const boxX = minCol * this.pitch;
      const boxY = minRow * this.pitch;
      const boxW = (maxCol - minCol + 1) * this.pitch;
      const boxH = (maxRow - minRow + 1) * this.pitch;

      this.ctx.lineWidth = 2.5;
      this.ctx.strokeStyle = this.boxActiveColor;
      this.ctx.setLineDash([4, 4]);
      this.ctx.strokeRect(boxX, boxY, boxW, boxH);
      this.ctx.setLineDash([]);

      if (isSquare && this.visualConfig.groupingMode === 'auto-square') {
        const startCenterX = (startTile.col + 0.5) * this.pitch;
        const startCenterY = (startTile.row + 0.5) * this.pitch;
        const furthestCornerX = (currentTile.col + (dirX > 0 ? 1 : 0)) * this.pitch;
        const furthestCornerY = (currentTile.row + (dirY > 0 ? 1 : 0)) * this.pitch;

        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = this.diagActiveColor;
        this.ctx.beginPath();
        this.ctx.moveTo(startCenterX, startCenterY);
        this.ctx.lineTo(furthestCornerX, furthestCornerY);
        this.ctx.stroke();
      }
    } else if (activeAction === 'diagonal') {
      const startCenterX = (startTile.col + 0.5) * this.pitch;
      const startCenterY = (startTile.row + 0.5) * this.pitch;

      if (!isShiftPressed) {
        const dx = dragCurrent.x - startCenterX;
        const dy = dragCurrent.y - startCenterY;
        const rDirX = dx >= 0 ? 1 : -1;
        const rDirY = dy >= 0 ? 1 : -1;

        const avgDist = (Math.abs(dx) + Math.abs(dy)) / 2;
        const steps = Math.max(0, Math.round(avgDist / this.pitch));

        const maxStepsX = rDirX > 0 ? cols - 1 - startTile.col : startTile.col;
        const maxStepsY = rDirY > 0 ? rows - 1 - startTile.row : startTile.row;
        const actualSteps = Math.min(steps, Math.min(maxStepsX, maxStepsY));

        const targetCol = startTile.col + rDirX * actualSteps;
        const targetRow = startTile.row + rDirY * actualSteps;

        const furthestCornerX = (targetCol + (rDirX > 0 ? 1 : 0)) * this.pitch;
        const furthestCornerY = (targetRow + (rDirY > 0 ? 1 : 0)) * this.pitch;

        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = this.diagActiveColor;
        this.ctx.beginPath();
        this.ctx.moveTo(startCenterX, startCenterY);
        this.ctx.lineTo(furthestCornerX, furthestCornerY);
        this.ctx.stroke();

        this.ctx.fillStyle = this.diagActiveColor;
        this.ctx.beginPath();
        this.ctx.arc(furthestCornerX, furthestCornerY, 5, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  // Layer 6: Draw Number Text
  private drawNumberText(): void {
    const { matrix, rows, cols, textSize } = this.board;
    const { textColor, textBorderColor } = this.visualConfig;

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = matrix[r]?.[c] ?? 0;
        if (val === 0) continue;

        const cx = (c + 0.5) * this.pitch;
        const cy = (r + 0.5) * this.pitch;

        this.ctx.font = `900 ${textSize}px 'Segoe UI', sans-serif`;
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = textBorderColor;
        this.ctx.strokeText(val.toString(), cx, cy + 2);

        this.ctx.fillStyle = textColor;
        this.ctx.fillText(val.toString(), cx, cy + 2);
      }
    }
  }

  // Layer 7: Active Clearing Animations
  private drawClearingAnimations(): void {
    const { shapeSize, tileBorder, textSize, clearingAnimations } = this.board;
    const { textColor, textBorderColor } = this.visualConfig;
    const headSize = shapeSize * 0.95;
    const headOffset = (shapeSize - headSize) / 2;
    const hasCatHead = gameAssets.catHead.complete && gameAssets.catHead.naturalWidth > 0;

    for (let i = 0; i < clearingAnimations.length; i++) {
      const anim = clearingAnimations[i];
      if (!anim) continue;
      const elapsed = this.now - anim.startTime;
      if (elapsed >= anim.duration) continue;

      const progress = elapsed / anim.duration;
      const cellX = anim.col * this.pitch + tileBorder;
      const cellY = anim.row * this.pitch + tileBorder;
      const cx = (anim.col + 0.5) * this.pitch;
      const cy = (anim.row + 0.5) * this.pitch;

      if (anim.type === 'munching') {
        const bounceCount = (anim.duration / 1000) * (anim.bounceSpeed / 10);
        const currentBounce = Math.sin(progress * Math.PI * bounceCount);
        const yOffset = -Math.abs(currentBounce) * (shapeSize * 0.3);
        const scale = 1 + Math.abs(currentBounce) * 0.2;

        this.ctx.save();
        this.ctx.translate(cx, cy);
        this.ctx.scale(scale, scale);
        this.ctx.translate(-cx, -cy);

        if (hasCatHead) {
          this.ctx.drawImage(
            gameAssets.catHead,
            cellX + headOffset,
            cellY + headOffset + yOffset,
            headSize,
            headSize
          );
        }

        this.ctx.font = `900 ${textSize}px 'Segoe UI', sans-serif`;
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = textBorderColor;
        this.ctx.strokeText(anim.val.toString(), cx, cy + yOffset + 2);

        this.ctx.fillStyle = textColor;
        this.ctx.fillText(anim.val.toString(), cx, cy + yOffset + 2);

        this.ctx.restore();
      } else {
        const alpha = Math.max(0, 1 - progress);
        this.ctx.save();
        this.ctx.globalAlpha = alpha;

        if (hasCatHead) {
          this.ctx.drawImage(
            gameAssets.catHead,
            cellX + headOffset,
            cellY + headOffset,
            headSize,
            headSize
          );
        }

        this.ctx.font = `900 ${textSize}px 'Segoe UI', sans-serif`;
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = textBorderColor;
        this.ctx.strokeText(anim.val.toString(), cx, cy + 2);

        this.ctx.fillStyle = textColor;
        this.ctx.fillText(anim.val.toString(), cx, cy + 2);

        this.ctx.restore();
      }
    }
  }
}
