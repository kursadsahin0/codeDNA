"use client";

import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogCloseButton,
} from "@/components/ui/dialog";
import { IconButton } from "@/components/ui/icon-button";
import { useToast } from "@/components/ui/toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Specimen } from "./specimen";
import { ShowcaseSection } from "./showcase-section";

export const overlaySection = {
  id: "overlays",
  title: "Overlays",
  keywords: "dialog tooltip toast menu modal notification",
};

export function OverlaySection() {
  const { toast } = useToast();

  return (
    <ShowcaseSection
      id={overlaySection.id}
      title={overlaySection.title}
      description="Dialogs trap focus. Escape closes them. Toasts stay in the browser and do not confirm a server action."
    >
      <Specimen label="Triggers" className="flex flex-wrap items-center gap-3">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Open dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <div>
                <DialogTitle>Focus stays inside</DialogTitle>
                <DialogDescription>
                  Tab cycles through these actions. Escape or the scrim closes the dialog and
                  returns focus to the trigger.
                </DialogDescription>
              </div>
              <DialogCloseButton />
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Close</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button>Done</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <IconButton label="Dialog keyboard note" variant="outline">
              <Info />
            </IconButton>
          </TooltipTrigger>
          <TooltipContent>Keyboard focus stays inside an open dialog.</TooltipContent>
        </Tooltip>
        <Button
          variant="secondary"
          onClick={() =>
            toast({
              title: "Saved in this example",
              description: "The notice lives in the browser only.",
              variant: "success",
            })
          }
        >
          Success toast
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast({
              title: "Check the contrast",
              description: "Status text uses the subtle foreground token.",
              variant: "warning",
            })
          }
        >
          Warning toast
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast({
              title: "Nothing was sent",
              description: "There is no repository request to fail.",
              variant: "danger",
            })
          }
        >
          Danger toast
        </Button>
      </Specimen>
    </ShowcaseSection>
  );
}
