import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconX } from "@tabler/icons-react";
import { cn } from "erxes-ui";

export const Modal = ({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) => {
  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="eduflow:fixed eduflow:inset-0 eduflow:z-[200] eduflow:flex eduflow:items-center eduflow:justify-center eduflow:bg-black/70 eduflow:p-4 eduflow:backdrop-blur-md"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "eduflow:relative eduflow:flex eduflow:max-h-[92vh] eduflow:w-full eduflow:max-w-4xl eduflow:flex-col eduflow:overflow-hidden eduflow:rounded-3xl eduflow:border eduflow:border-edu-lav/20 eduflow:bg-edu-card eduflow:shadow-[0_24px_80px_-20px_#000]",
          className,
        )}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="eduflow:flex eduflow:items-center eduflow:justify-between eduflow:gap-3 eduflow:border-b eduflow:border-edu-border eduflow:px-5 eduflow:py-3.5">
          <h2 className="eduflow:text-sm eduflow:font-semibold eduflow:text-white">
            {title}
          </h2>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            aria-label="Хаах"
            className="eduflow:flex eduflow:size-9 eduflow:items-center eduflow:justify-center eduflow:rounded-full eduflow:border eduflow:border-edu-border eduflow:bg-edu-card2 eduflow:text-edu-text eduflow:transition hover:eduflow:border-edu-lav/40 hover:eduflow:text-white focus-visible:eduflow:outline-2 focus-visible:eduflow:outline-edu-lav"
          >
            <IconX className="eduflow:size-4" />
          </button>
        </div>
        <div className="eduflow:overflow-y-auto eduflow:p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
};
