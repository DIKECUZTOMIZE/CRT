import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

export const DetailAccordion = ({
  title,
  badge,
  icon: Icon,
  children,
  initialOpen = false,
  viewLabel = "View details",
  hideLabel = "Hide details",
  className = "",
  bodyClassName = "",
  iconClassName = "",
  badgeClassName = "",
  open,
  onToggle,
}) => {
  const [internalOpen, setInternalOpen] = useState(initialOpen);
  const isOpen = open ?? internalOpen;

  const handleToggle = () => {
    if (onToggle) {
      onToggle(!isOpen);
      return;
    }

    setInternalOpen((prev) => !prev);
  };

  return (
    <div className={`panel-shell ${className}`.trim()}>
      <button
        type="button"
        onClick={handleToggle}
        className="panel-header"
        aria-expanded={isOpen}
      >
        <div className="panel-header__left">
          {Icon && (
            <div className={`panel-icon ${iconClassName}`.trim()}>
              <Icon className="h-3.5 w-3.5" />
            </div>
          )}

          <h3 className="panel-title">{title}</h3>

          {badge && (
            <span className={`panel-badge ${badgeClassName}`.trim()}>{badge}</span>
          )}
        </div>

        <div className="panel-header__right">
          <span className="panel-label hidden sm:inline">
            {isOpen ? hideLabel : viewLabel}
          </span>
          <ChevronDown
            className={`panel-chevron ${isOpen ? "is-open" : ""}`.trim()}
          />
        </div>
      </button>

      {isOpen && (
        <div className={`panel-body ${bodyClassName}`.trim()}>{children}</div>
      )}
    </div>
  );
};

export default DetailAccordion;
