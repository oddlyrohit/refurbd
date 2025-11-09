"use client";
import * as React from "react";
import cx from "classnames";

type Props = {
  value: number;          // 0..100
  className?: string;
};

export default function Progress({ value, className }: Props) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className={cx("h-2 w-full rounded-full bg-slate-200", className)} aria-label="progress">
      <div className="h-2 rounded-full bg-slate-900 transition-all" style={{ width: `${v}%` }} />
    </div>
  );
}
