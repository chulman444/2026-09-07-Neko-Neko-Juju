import React from 'react';
import { useRouter } from './context';

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  replace?: boolean;
}

export const Link: React.FC<LinkProps> = ({
  href,
  replace,
  onClick,
  target,
  children,
  ...rest
}) => {
  const { navigate } = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e);
    }

    if (
      e.defaultPrevented ||
      target === '_blank' ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.altKey ||
      e.shiftKey
    ) {
      return;
    }

    if (href.startsWith('/') || !href.includes('://')) {
      e.preventDefault();
      navigate(href, { replace });
    }
  };

  return (
    <a href={href} target={target} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
};
