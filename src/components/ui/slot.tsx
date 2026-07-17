import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { cn } from "@/lib/utils";

/**
 * Minimal `asChild` slot: merges this component's props onto its single child
 * element instead of rendering a wrapper. Enough for our design system
 * (className merge + ref + event forwarding) without pulling in Radix.
 */
type SlotProps = HTMLAttributes<HTMLElement> & { children?: ReactNode };

function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref && typeof ref === "object") {
        (ref as { current: T | null }).current = node;
      }
    }
  };
}

export const Slot = forwardRef<HTMLElement, SlotProps>(({ children, className, ...slotProps }, ref) => {
  if (!isValidElement(children)) {
    return null;
  }

  const child = Children.only(children) as ReactElement<Record<string, unknown>>;
  const childProps = child.props;
  const childRef = (child as unknown as { ref?: Ref<HTMLElement> }).ref;

  return cloneElement(child, {
    ...slotProps,
    ...childProps,
    className: cn(className, childProps.className as string | undefined),
    ref: ref ? mergeRefs(ref, childRef) : childRef,
  });
});
Slot.displayName = "Slot";
