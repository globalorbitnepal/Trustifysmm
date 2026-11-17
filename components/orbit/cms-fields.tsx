import type { ReactNode } from "react";
import { OrbitIcon } from "@/components/orbit/orbit-icons";
import type { ComponentProps } from "react";

type IconName = ComponentProps<typeof OrbitIcon>["name"];

export function CmsSectionHead({ icon, title, hint }: { icon: IconName; title: string; hint?: string }) {
  return (
    <div className="ob-cms-head">
      <span className="ob-cms-head-ico" aria-hidden>
        <OrbitIcon name={icon} />
      </span>
      <div>
        <h3 style={{ margin: 0 }}>{title}</h3>
        {hint ? <p className="ob-muted" style={{ margin: "4px 0 0" }}>{hint}</p> : null}
      </div>
    </div>
  );
}

export function ImageUrlField({
  label,
  value,
  onChange,
  onClear,
  hint,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onClear?: () => void;
  hint?: ReactNode;
}) {
  return (
    <div className="ob-cms-image-field">
      <label>
        {label}
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="/media/orbit/… or /brand/…" />
      </label>
      <div className="ob-cms-image-row">
        {value ? (
          <div className="ob-cms-thumb">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" />
          </div>
        ) : (
          <h5 className="ob-muted ob-cms-thumb-empty">No image — paste URL from Media library</h5>
        )}
        <div className="ob-toolbar" style={{ flexWrap: "wrap" }}>
          {onClear && value ? (
            <button className="ob-btn ghost" type="button" onClick={onClear}>
              Remove image
            </button>
          ) : null}
        </div>
      </div>
      {hint ? <p className="ob-muted">{hint}</p> : null}
    </div>
  );
}