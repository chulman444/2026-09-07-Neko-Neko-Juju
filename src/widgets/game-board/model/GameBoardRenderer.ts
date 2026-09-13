import { type TileCoord, isOmniTile } from '@/entities/board';
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
  private targetTile: TileCoord | null = null;
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
    now: number,
    targetTile?: TileCoord | null
  ): void {
    this.board = board;
    this.visualConfig = visualConfig;
    this.interaction = interaction;
    this.highlightedTiles = highlightedTiles;
    this.targetTile = targetTile ?? null;
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
    this.drawTargetIndicator();
    this.drawSelectionOverlays();
    this.drawValidSumCatHeads();
    this.drawSelectionIndicators();
    this.drawNumberText();
    this.drawTargetBadge();
    this.drawClearingAnimations();
  }

  // Layer 1: Background & Checkerboard
  private drawBackground(): void {
    const { cols, rows } = this.board;
    const mode = this.visualConfig.checkerboardMode ?? '2-color';
    const bg = this.visualConfig.gameBg;

    // Fill entire canvas with base background
    this.ctx.fillStyle = bg;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (mode === 'off' || !this.pitch) {
      return;
    }

    const defaultColors = ['#fbf2df', '#ebd6b3', '#dcbe8e'];
    const colors =
      this.visualConfig.checkerColors && this.visualConfig.checkerColors.length > 0
        ? this.visualConfig.checkerColors
        : defaultColors;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const colorIdx = mode === '3-color' ? ((r + c) % 3 + 3) % 3 : (r + c) % 2;
        const color = colors[colorIdx % colors.length] ?? colors[0];

        this.ctx.fillStyle = color;
        this.ctx.fillRect(c * this.pitch, r * this.pitch, this.pitch, this.pitch);
      }
    }
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

  // Layer 2.6: Target Indicator (animated pulsating aura & reticles for targeted tile)
  private drawTargetIndicator(): void {
    if (!this.targetTile) return;
    const { shapeSize, tileBorder } = this.board;
    const { col, row } = this.targetTile;

    const cellX = col * this.pitch + tileBorder;
    const cellY = row * this.pitch + tileBorder;
    const pulse = 0.5 + 0.5 * Math.sin(this.now / 150);

    // 1. Semi-transparent magenta/purple glow wash inside bowl
    this.ctx.fillStyle = `rgba(168, 85, 247, ${0.25 + pulse * 0.2})`;
    this.ctx.beginPath();
    this.ctx.roundRect(cellX, cellY, shapeSize, shapeSize, 10);
    this.ctx.fill();

    // 2. Animated marching ants dashed border
    this.ctx.save();
    this.ctx.strokeStyle = `rgba(192, 38, 211, ${0.8 + pulse * 0.2})`;
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([6, 4]);
    this.ctx.lineDashOffset = -this.now / 30;
    this.ctx.beginPath();
    this.ctx.roundRect(cellX - 3, cellY - 3, shapeSize + 6, shapeSize + 6, 12);
    this.ctx.stroke();
    this.ctx.restore();

    // 3. Crisp corner crosshair brackets
    const bracketLen = Math.min(10, shapeSize * 0.25);
    this.ctx.save();
    this.ctx.strokeStyle = '#a855f7';
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';

    // Top-left
    this.ctx.beginPath();
    this.ctx.moveTo(cellX - 4, cellY - 4 + bracketLen);
    this.ctx.lineTo(cellX - 4, cellY - 4);
    this.ctx.lineTo(cellX - 4 + bracketLen, cellY - 4);
    this.ctx.stroke();

    // Top-right
    this.ctx.beginPath();
    this.ctx.moveTo(cellX + shapeSize + 4 - bracketLen, cellY - 4);
    this.ctx.lineTo(cellX + shapeSize + 4, cellY - 4);
    this.ctx.lineTo(cellX + shapeSize + 4, cellY - 4 + bracketLen);
    this.ctx.stroke();

    // Bottom-left
    this.ctx.beginPath();
    this.ctx.moveTo(cellX - 4, cellY + shapeSize + 4 - bracketLen);
    this.ctx.lineTo(cellX - 4, cellY + shapeSize + 4);
    this.ctx.lineTo(cellX - 4 + bracketLen, cellY + shapeSize + 4);
    this.ctx.stroke();

    // Bottom-right
    this.ctx.beginPath();
    this.ctx.moveTo(cellX + shapeSize + 4 - bracketLen, cellY + shapeSize + 4);
    this.ctx.lineTo(cellX + shapeSize + 4, cellY + shapeSize + 4);
    this.ctx.lineTo(cellX + shapeSize + 4, cellY + shapeSize + 4 - bracketLen);
    this.ctx.stroke();
    this.ctx.restore();
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

  // Layer 5: Drag Box & Ray Indicators
  private drawSelectionIndicators(): void {
    const { cols, rows } = this.board;
    const {
      activeAction,
      isShiftPressed,
      dragStart,
      dragCurrent,
      startTile,
      currentTile,
      isSquare,
      dirX,
      dirY,
    } = this.interaction;

    if (activeAction === 'box') {
      const x = Math.min(dragStart.x, dragCurrent.x);
      const y = Math.min(dragStart.y, dragCurrent.y);
      const w = Math.abs(dragCurrent.x - dragStart.x);
      const h = Math.abs(dragCurrent.y - dragStart.y);

      // Only draw the drag box strokeRect if actively extending/dragging beyond a click threshold
      if (w > 4 || h > 4) {
        this.ctx.strokeStyle = this.boxActiveColor;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, w, h);
      }

      if (this.visualConfig.groupingMode === 'auto-square' && isSquare) {
        const startCenterX = (startTile.col + 0.5) * this.pitch;
        const startCenterY = (startTile.row + 0.5) * this.pitch;
        const furthestCornerX = (currentTile.col + (dirX > 0 ? 1 : 0)) * this.pitch;
        const furthestCornerY = (currentTile.row + (dirY > 0 ? 1 : 0)) * this.pitch;

        const maxExtension = Math.max(this.canvas.width, this.canvas.height) * 2;
        const rayEndX = (currentTile.col + 0.5) * this.pitch + dirX * maxExtension;
        const rayEndY = (currentTile.row + 0.5) * this.pitch + dirY * maxExtension;

        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = this.diagActiveColor;

        this.ctx.setLineDash([]);
        this.ctx.beginPath();
        this.ctx.moveTo(startCenterX, startCenterY);
        this.ctx.lineTo(furthestCornerX, furthestCornerY);
        this.ctx.stroke();

        this.ctx.setLineDash([6, 6]);
        this.ctx.beginPath();
        this.ctx.moveTo(furthestCornerX, furthestCornerY);
        this.ctx.lineTo(rayEndX, rayEndY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        this.ctx.fillStyle = this.diagActiveColor;
        this.ctx.beginPath();
        this.ctx.arc(furthestCornerX, furthestCornerY, 5, 0, Math.PI * 2);
        this.ctx.fill();
      }
    } else if (activeAction === 'diagonal') {
      const startCenterX = (startTile.col + 0.5) * this.pitch;
      const startCenterY = (startTile.row + 0.5) * this.pitch;
      const distFromStart = Math.hypot(dragCurrent.x - startCenterX, dragCurrent.y - startCenterY);

      if (distFromStart > 4) {
        if (isShiftPressed) {
          this.ctx.lineWidth = 3;
          this.ctx.strokeStyle = this.diagActiveColor;
          this.ctx.setLineDash([]);
          this.ctx.beginPath();
          this.ctx.moveTo(startCenterX, startCenterY);
          this.ctx.lineTo(dragCurrent.x, dragCurrent.y);
          this.ctx.stroke();

          this.ctx.fillStyle = this.diagActiveColor;
          this.ctx.beginPath();
          this.ctx.arc(dragCurrent.x, dragCurrent.y, 5, 0, Math.PI * 2);
          this.ctx.fill();
        } else {
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

          const maxExtension = Math.max(this.canvas.width, this.canvas.height) * 2;
          const rayEndX = (targetCol + 0.5) * this.pitch + rDirX * maxExtension;
          const rayEndY = (targetRow + 0.5) * this.pitch + rDirY * maxExtension;

          this.ctx.lineWidth = 3;
          this.ctx.strokeStyle = this.diagActiveColor;

          this.ctx.setLineDash([]);
          this.ctx.beginPath();
          this.ctx.moveTo(startCenterX, startCenterY);
          this.ctx.lineTo(furthestCornerX, furthestCornerY);
          this.ctx.stroke();

          this.ctx.setLineDash([6, 6]);
          this.ctx.beginPath();
          this.ctx.moveTo(furthestCornerX, furthestCornerY);
          this.ctx.lineTo(rayEndX, rayEndY);
          this.ctx.stroke();
          this.ctx.setLineDash([]);

          this.ctx.fillStyle = this.diagActiveColor;
          this.ctx.beginPath();
          this.ctx.arc(furthestCornerX, furthestCornerY, 5, 0, Math.PI * 2);
          this.ctx.fill();
        }
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

        const isOmni = isOmniTile(val);
        const textToDraw = isOmni ? '*' : val.toString();
        const effectiveSize = isOmni ? Math.round(textSize * 1.5) : textSize;
        const textOffsetY = isOmni ? cy + Math.round(textSize * 0.35) : cy + 2;

        this.ctx.font = `900 ${effectiveSize}px 'Segoe UI', sans-serif`;
        this.ctx.lineWidth = isOmni ? 4 : 3;
        this.ctx.strokeStyle = isOmni ? '#78350f' : textBorderColor;
        this.ctx.strokeText(textToDraw, cx, textOffsetY);

        this.ctx.fillStyle = isOmni ? '#fbbf24' : textColor;
        this.ctx.fillText(textToDraw, cx, textOffsetY);
      }
    }
  }

  // Layer 6.5: Floating Target Badge ("TARGET TILE" pill indicator)
  private drawTargetBadge(): void {
    if (!this.targetTile) return;
    const { shapeSize, tileBorder } = this.board;
    const { col, row } = this.targetTile;

    const cellX = col * this.pitch + tileBorder;
    const cellY = row * this.pitch + tileBorder;
    const badgeW = 68;
    const badgeH = 16;
    const badgeX = cellX + shapeSize / 2 - badgeW / 2;
    const badgeY = Math.max(2, cellY - 12);

    this.ctx.save();
    this.ctx.fillStyle = '#7e22ce';
    this.ctx.strokeStyle = '#f3e8ff';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 8);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 9px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('TARGET TILE', cellX + shapeSize / 2, badgeY + badgeH / 2);
    this.ctx.restore();
  }

  // Layer 7: Active Clearing Animations
  private drawClearingAnimations(): void {
    const { shapeSize, tileBorder, textSize, clearingAnimations } = this.board;
    const { textColor, textBorderColor } = this.visualConfig;
    const headSize = shapeSize * 0.95;
    const headOffset = (shapeSize - headSize) / 2;

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

      let opacity = 1;
      let bounceOffset = 0;

      if (anim.type === 'fadeout') {
        opacity = Math.max(0, 1 - progress);
      } else {
        const bounceCycleMs = (anim.bounceSpeed || 80) * 2;
        const bounceCycle = (elapsed % bounceCycleMs) / bounceCycleMs;
        const bounceFactor = Math.sin(bounceCycle * Math.PI * 2);
        bounceOffset = bounceFactor * (shapeSize * 0.15);
        opacity = progress > 0.6 ? Math.max(0, (1 - progress) / 0.4) : 1;
      }

      this.ctx.save();
      this.ctx.globalAlpha = opacity;

      if (gameAssets.bowl.complete && gameAssets.bowl.naturalWidth > 0) {
        this.ctx.drawImage(gameAssets.bowl, cellX, cellY, shapeSize, shapeSize);
      }

      if (gameAssets.catHead.complete && gameAssets.catHead.naturalWidth > 0) {
        this.ctx.drawImage(
          gameAssets.catHead,
          cellX + headOffset,
          cellY + headOffset + bounceOffset - shapeSize * 0.05,
          headSize,
          headSize
        );
      }

      if (anim.val !== undefined) {
        const isOmni = isOmniTile(anim.val);
        const textToDraw = isOmni ? '*' : anim.val.toString();
        const effectiveSize = isOmni ? Math.round(textSize * 1.5) : textSize;
        const textOffsetY = isOmni ? cy + Math.round(textSize * 0.35) : cy + 2;

        this.ctx.font = `900 ${effectiveSize}px 'Segoe UI', sans-serif`;
        this.ctx.lineWidth = isOmni ? 4 : 3;
        this.ctx.strokeStyle = isOmni ? '#78350f' : textBorderColor;
        this.ctx.strokeText(textToDraw, cx, textOffsetY);

        this.ctx.fillStyle = isOmni ? '#fbbf24' : textColor;
        this.ctx.fillText(textToDraw, cx, textOffsetY);
      }

      this.ctx.restore();
    }
  }
}
