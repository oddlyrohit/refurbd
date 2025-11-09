"use client";
import * as React from "react";
import cx from "classnames";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

export function Card({ title, description, className, children, ...rest }: CardProps) {
  return (
    <div className={cx("rounded-2xl border border-slate-200 bg-white shadow-sm", className)} {...rest}>
      {(title || description) && (
        <div className="border-b border-slate-100 p-4">
          {title && <h3 className="text-base font-semibold">{title}</h3>}
          {description && <p className="text-sm text-slate-600">{description}</p>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

// Optional shadcn-like pieces so existing imports won't break if used elsewhere
export function CardHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("p-4 border-b border-slate-100", props.className)} />;
}
export function CardTitle(props: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 {...props} className={cx("text-base font-semibold", props.className)} />;
}
export function CardDescription(props: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} className={cx("text-sm text-slate-600", props.className)} />;
}
export function CardContent(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("p-4", props.className)} />;
}

export default Card;
