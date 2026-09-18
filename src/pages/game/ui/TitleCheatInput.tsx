import React from 'react';
import { useCheatCode } from '../model/useCheatCode';

export interface TitleCheatInputProps {
  className?: string;
  onCheatSuccess?: () => void;
  titleText?: string;
}

export const TitleCheatInput: React.FC<TitleCheatInputProps> = ({
  className = '',
  onCheatSuccess,
  titleText = 'Neko Neko Juju',
}) => {
  const {
    cheatBuffer,
    isFadingOut,
    isSuccess,
    inputRef,
    handleInputChange,
    handleKeyDown,
    handleFocus,
    handleBlur,
    focusInput,
  } = useCheatCode({ onCheatSuccess });

  return (
    <div
      className={`relative inline-flex items-center transition-opacity duration-200 ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      } ${className}`.trim()}
      onClick={focusInput}
      title="Neko Neko Juju (Click to interact)"
    >
      <input
        ref={inputRef}
        type="text"
        value={cheatBuffer}
        placeholder={titleText}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className={`border-none outline-none bg-transparent p-0 m-0 cursor-pointer leading-none text-xl font-black tracking-tight text-neko-primary placeholder:text-neko-primary placeholder:opacity-100 focus:cursor-text transition-all ${
          cheatBuffer.length > 0
            ? 'font-mono text-lg text-amber-500 underline decoration-dashed underline-offset-4'
            : ''
        }`}
        style={{
          width:
            cheatBuffer.length > 0
              ? `${Math.max(cheatBuffer.length + 1, 10)}ch`
              : `${titleText.length + 1}ch`,
        }}
        aria-label={titleText}
      />
      {isSuccess && (
        <span className="absolute -top-3.5 right-0 text-[10px] font-bold text-emerald-500 animate-pulse whitespace-nowrap bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/30">
          ✨ Dev Tools Unlocked!
        </span>
      )}
    </div>
  );
};
